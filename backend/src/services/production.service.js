import prisma from '../config/prisma.js';
import { createTransaction } from './inventory.service.js';

export const getProductionJobs = async ({ skip, take, search, status, stage }) => {
  const where = {};

  if (status) where.status = status;
  if (stage) where.productionStage = stage;

  if (search) {
    where.OR = [
      { productionNumber: { contains: search, mode: 'insensitive' } },
      { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
      { order: { furnitureName: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const [jobs, total] = await Promise.all([
    prisma.productionJob.findMany({
      where,
      skip,
      take,
      include: {
        order: {
          include: { customer: true }
        },
        tasks: true,
        inspections: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.productionJob.count({ where })
  ]);

  return { jobs, total };
};

export const getProductionJobById = async (id) => {
  return prisma.productionJob.findUnique({
    where: { id },
    include: {
      order: {
        include: { 
          customer: true,
          orderMaterials: { include: { material: true } }
        }
      },
      tasks: {
        orderBy: { createdAt: 'asc' }
      },
      inspections: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (job) {
    // Fetch AuditLogs for this job (Stage history)
    const logs = await prisma.auditLog.findMany({
      where: { module: 'Production', newValue: { path: ['id'], equals: job.id } },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true } } }
    });
    job.history = logs;
  }

  return job;
};

export const createProductionJob = async (data, createdBy = null) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Check if job already exists for this order
    const existingJob = await tx.productionJob.findUnique({
      where: { orderId: data.orderId }
    });
    
    if (existingJob) {
      throw new Error('A production job already exists for this order.');
    }

    // 2. Fetch order and required materials
    const orderWithMaterials = await tx.order.findUnique({
      where: { id: data.orderId },
      include: { 
        orderMaterials: { include: { material: true } }
      }
    });

    if (!orderWithMaterials) {
      throw new Error('Order not found.');
    }

    // 3. Pre-flight Stock Check
    const shortages = [];
    for (const om of orderWithMaterials.orderMaterials) {
      if (om.material.availableStock < om.quantityRequired) {
        shortages.push({
          materialName: om.material.materialName,
          required: om.quantityRequired,
          available: om.material.availableStock,
          unit: om.material.unit
        });
      }
    }

    if (shortages.length > 0) {
      const error = new Error('INSUFFICIENT_STOCK');
      error.shortages = shortages;
      throw error;
    }

    // 4. Auto-generate PROD0001
    const lastJob = await tx.productionJob.findFirst({
      orderBy: { productionNumber: 'desc' }
    });

    let nextNumber = 1;
    if (lastJob && lastJob.productionNumber.startsWith('PROD')) {
      const lastNumberStr = lastJob.productionNumber.replace('PROD', '');
      const lastNumber = parseInt(lastNumberStr, 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
    const productionNumber = `PROD${nextNumber.toString().padStart(4, '0')}`;

    // 5. Create Job
    const job = await tx.productionJob.create({
      data: {
        productionNumber,
        orderId: data.orderId,
        productionStage: 'MaterialAllocation',
        priority: data.priority || 'Medium',
        startDate: new Date(),
        expectedCompletionDate: data.expectedCompletionDate ? new Date(data.expectedCompletionDate) : null,
        status: 'InProgress',
        remarks: data.remarks
      }
    });

    // 6. Update order status
    await tx.order.update({
      where: { id: data.orderId },
      data: { orderStatus: 'InProduction' }
    });

    return job;
  });
};

export const advanceStage = async (id, stage, user) => {
  return await prisma.$transaction(async (tx) => {
    const job = await tx.productionJob.findUnique({
      where: { id },
      include: { order: { include: { orderMaterials: { include: { material: true } } } } }
    });

    if (!job) throw new Error('Job not found');

    // If advancing to WoodCutting, perform inventory deduction
    if (stage === 'WoodCutting' && job.productionStage === 'MaterialAllocation') {
      const orderWithMaterials = job.order;
      
      // 1. Pre-flight Stock Check
      const shortages = [];
      for (const om of orderWithMaterials.orderMaterials) {
        if (om.material.availableStock < om.quantityRequired) {
          shortages.push({
            materialName: om.material.materialName,
            required: om.quantityRequired,
            available: om.material.availableStock
          });
        }
      }

      if (shortages.length > 0) {
        const shortageDetails = shortages.map(s => `${s.materialName} (Needs: ${s.required}, Has: ${s.available})`).join(', ');
        throw new Error(`Insufficient stock to start Cutting & Milling. Shortages: ${shortageDetails}`);
      }

      // 2. Atomic Inventory Deduction
      if (orderWithMaterials.orderMaterials.length > 0) {
        for (const om of orderWithMaterials.orderMaterials) {
          const newStock = om.material.availableStock - om.quantityRequired;

          await tx.material.update({
            where: { id: om.materialId },
            data: { availableStock: newStock }
          });

          await tx.inventoryTransaction.create({
            data: {
              materialId: om.materialId,
              transactionType: 'StockOut',
              quantity: om.quantityRequired,
              reference: job.productionNumber,
              remarks: `Auto-allocated for Order ${orderWithMaterials.orderNumber}`,
              createdBy: user?.id
            }
          });

          // Check for LOW_STOCK alert
          const updatedMaterial = await tx.material.findUnique({ where: { id: om.materialId } });
          const threshold = updatedMaterial.reorderLevel > 0 ? updatedMaterial.reorderLevel : updatedMaterial.minimumStock;
          
          if (newStock < threshold) {
            await tx.notification.create({
              data: {
                title: 'Low Stock Alert',
                message: `Material ${updatedMaterial.materialName} has dropped below the threshold (${newStock} ${updatedMaterial.unit} remaining).`,
                type: 'LOW_STOCK',
                priority: 'high',
                referenceId: updatedMaterial.id
              }
            });
          }
        }
      }
    }

    // Advance Stage
    const updatedJob = await tx.productionJob.update({
      where: { id },
      data: { productionStage: stage },
      include: { order: true }
    });

    // Sync order status
    if (stage === 'QualityInspection') {
      await tx.order.update({
        where: { id: job.orderId },
        data: { orderStatus: 'QualityCheck' }
      });
    } else if (stage === 'ReadyForDelivery') {
      await tx.order.update({
        where: { id: job.orderId },
        data: { orderStatus: 'ReadyForDelivery' }
      });
      await tx.productionJob.update({
        where: { id },
        data: { status: 'Completed', actualCompletionDate: new Date() }
      });
    }

    return updatedJob;
  });
};

export const assignWorker = async (id, assignedEmployee) => {
  return prisma.productionJob.update({
    where: { id },
    data: { assignedEmployee },
    include: { order: true }
  });
};

export const updateProductionJob = async (id, data) => {
  const updateData = { ...data };
  
  // Extract updatedAt for optimistic concurrency control
  const clientUpdatedAt = updateData.updatedAt;
  delete updateData.updatedAt;
  
  if (data.status === 'Completed') {
    updateData.actualCompletionDate = new Date();
  }

  return await prisma.$transaction(async (tx) => {
    if (clientUpdatedAt) {
      const existingJob = await tx.productionJob.findUnique({
        where: { id },
        select: { updatedAt: true }
      });
      
      if (!existingJob) throw new Error('Job not found');
      
      // Compare timestamps. Note: JS Dates from DB might have more precision than client JSON.
      // A simple time comparison using getTime() is safer.
      if (existingJob.updatedAt.getTime() !== new Date(clientUpdatedAt).getTime()) {
        throw new Error('CONFLICT: This job was updated by another user. Please refresh to see the latest.');
      }
    }

    const job = await tx.productionJob.update({
      where: { id },
      data: updateData,
      include: { order: true }
    });

    // Sync order status based on production stage/status
    if (updateData.status === 'Completed') {
      await tx.order.update({
        where: { id: job.orderId },
        data: { orderStatus: 'ReadyForDelivery' }
      });
    } else if (updateData.productionStage === 'QualityInspection') {
      await tx.order.update({
        where: { id: job.orderId },
        data: { orderStatus: 'QualityCheck' }
      });
    }

    return job;
  });
};

export const createProductionTask = async (jobId, data) => {
  return prisma.productionTask.create({
    data: {
      ...data,
      productionJobId: jobId,
      estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : null,
      actualHours: data.actualHours ? parseFloat(data.actualHours) : null
    }
  });
};

export const updateProductionTask = async (taskId, data) => {
  return prisma.productionTask.update({
    where: { id: taskId },
    data: {
      ...data,
      estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : undefined,
      actualHours: data.actualHours ? parseFloat(data.actualHours) : undefined
    }
  });
};

export const deleteProductionTask = async (taskId) => {
  return prisma.productionTask.delete({
    where: { id: taskId }
  });
};

export const createQualityInspection = async (jobId, data) => {
  return prisma.qualityInspection.create({
    data: {
      ...data,
      productionJobId: jobId,
      inspectionDate: data.inspectionDate ? new Date(data.inspectionDate) : new Date()
    }
  });
};
