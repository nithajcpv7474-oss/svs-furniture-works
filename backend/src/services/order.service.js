import prisma from '../config/prisma.js';

export const getOrders = async ({ skip, take, search, status, priority }) => {
  const where = { isDeleted: false };

  if (status) where.orderStatus = status;
  if (priority) where.priority = priority;

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customer: { fullName: { contains: search, mode: 'insensitive' } } },
      { furnitureName: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
};

export const getOrderById = async (id) => {
  return prisma.order.findFirst({
    where: { id, isDeleted: false },
    include: { 
      customer: true,
      orderMaterials: { include: { material: true } },
      statusHistory: {
        orderBy: { changedAt: 'desc' },
        include: { user: { select: { fullName: true, role: true } } }
      }
    }
  });
};

export const createOrder = async (data, files, createdBy) => {
  // Extract file paths if present
  const designImage = files?.designImage ? files.designImage[0].filename : null;
  const referenceDrawing = files?.referenceDrawing ? files.referenceDrawing[0].filename : null;

  // Handle OrderMaterials
  let orderMaterials = [];
  if (data.orderMaterials) {
    try {
      const parsedMaterials = JSON.parse(data.orderMaterials);
      if (Array.isArray(parsedMaterials)) {
        orderMaterials = parsedMaterials.map(m => {
          if (m.materialId === 'others') {
            return {
              materialId: null,
              customMaterialName: m.customMaterial,
              quantityRequired: parseFloat(m.quantityRequired)
            };
          }
          return {
            materialId: m.materialId,
            quantityRequired: parseFloat(m.quantityRequired)
          };
        });
      }
    } catch (err) {
      console.error('Error parsing orderMaterials', err);
    }
  }

  let parsedHardware = [];
  if (data.hardwareDetails) {
    try { parsedHardware = Array.isArray(data.hardwareDetails) ? data.hardwareDetails : JSON.parse(data.hardwareDetails); } 
    catch { parsedHardware = [data.hardwareDetails]; }
  }
  
  let parsedAccessories = [];
  if (data.accessories) {
    try { parsedAccessories = Array.isArray(data.accessories) ? data.accessories : JSON.parse(data.accessories); } 
    catch { parsedAccessories = [data.accessories]; }
  }

  const payload = {
    ...data,
    designImage,
    referenceDrawing,
    createdBy,
    quantity: parseInt(data.quantity) || 1,
    length: data.length ? parseFloat(data.length) : null,
    width: data.width ? parseFloat(data.width) : null,
    height: data.height ? parseFloat(data.height) : null,
    estimatedPrice: data.estimatedPrice ? parseFloat(data.estimatedPrice) : 0,
    advanceAmount: data.advanceAmount ? parseFloat(data.advanceAmount) : 0,
    balanceAmount: data.balanceAmount ? parseFloat(data.balanceAmount) : 0,
    upholsteryRequired: data.upholsteryRequired === 'true',
    glassRequired: data.glassRequired === 'true',
    expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
    hardwareDetails: parsedHardware,
    accessories: parsedAccessories,
    orderMaterials: {
      create: orderMaterials
    }
  };

  let retries = 3;
  let nextNumber = 1;

  // Initial order number sequence determination based on highest existing order number
  const lastOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (lastOrder && lastOrder.orderNumber.startsWith('ORD')) {
    const lastNumberStr = lastOrder.orderNumber.replace('ORD', '');
    const lastNumber = parseInt(lastNumberStr, 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  while (retries > 0) {
    try {
      const orderNumber = `ORD${nextNumber.toString().padStart(4, '0')}`;
      const order = await prisma.order.create({
        data: {
          ...payload,
          orderNumber
        },
      });
      return order;
    } catch (error) {
      // Prisma Unique Constraint Violation
      if (error.code === 'P2002' && error.meta?.target?.includes('orderNumber')) {
        console.warn(`Order number collision detected. Retrying... (${retries} attempts left)`);
        nextNumber += 1;
        retries -= 1;
      } else {
        throw error;
      }
    }
  }

  throw new Error('Failed to generate a unique order number after multiple attempts.');
};

export const updateOrder = async (id, data, files) => {
  const updateData = {
    ...data,
    quantity: data.quantity ? parseInt(data.quantity) : undefined,
    length: data.length ? parseFloat(data.length) : undefined,
    width: data.width ? parseFloat(data.width) : undefined,
    height: data.height ? parseFloat(data.height) : undefined,
    estimatedPrice: data.estimatedPrice ? parseFloat(data.estimatedPrice) : undefined,
    advanceAmount: data.advanceAmount ? parseFloat(data.advanceAmount) : undefined,
    balanceAmount: data.balanceAmount ? parseFloat(data.balanceAmount) : undefined,
  };

  if (data.hardwareDetails !== undefined) {
    try { updateData.hardwareDetails = Array.isArray(data.hardwareDetails) ? data.hardwareDetails : JSON.parse(data.hardwareDetails); } 
    catch { updateData.hardwareDetails = [data.hardwareDetails]; }
  }
  if (data.accessories !== undefined) {
    try { updateData.accessories = Array.isArray(data.accessories) ? data.accessories : JSON.parse(data.accessories); } 
    catch { updateData.accessories = [data.accessories]; }
  }

  if (data.upholsteryRequired !== undefined) updateData.upholsteryRequired = data.upholsteryRequired === 'true';
  if (data.glassRequired !== undefined) updateData.glassRequired = data.glassRequired === 'true';

  if (files?.designImage) {
    updateData.designImage = files.designImage[0].filename;
  }
  if (files?.referenceDrawing) {
    updateData.referenceDrawing = files.referenceDrawing[0].filename;
  }

  // Handle OrderMaterials update
  if (data.orderMaterials) {
    try {
      const parsedMaterials = JSON.parse(data.orderMaterials);
      if (Array.isArray(parsedMaterials)) {
        updateData.orderMaterials = {
          deleteMany: {},
          create: parsedMaterials.map(m => {
            if (m.materialId === 'others') {
              return {
                materialId: null,
                customMaterialName: m.customMaterial,
                quantityRequired: parseFloat(m.quantityRequired)
              };
            }
            return {
              materialId: m.materialId,
              quantityRequired: parseFloat(m.quantityRequired)
            };
          })
        };
      }
    } catch (err) {
      console.error('Error parsing orderMaterials in update', err);
    }
  }

  return prisma.order.update({
    where: { id },
    data: updateData,
  });
};

export const deleteOrder = async (id) => {
  return prisma.order.update({
    where: { id },
    data: { isDeleted: true },
  });
};

export const updateOrderStatus = async (id, data, user) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id } });
    if (!order) throw new Error('Order not found');

    const fromStatus = order.orderStatus;
    const toStatus = data.status;

    // Validation
    if (user.role !== 'Admin') {
      const validTransitions = {
        'Pending':        ['Confirmed', 'OnHold', 'Cancelled'],
        'Confirmed':      ['InProduction', 'OnHold', 'Cancelled'],
        'InProduction':   ['QualityCheck', 'OnHold', 'Cancelled'],
        'QualityCheck':   ['ReadyForDelivery', 'InProduction', 'OnHold', 'Cancelled'],
        'ReadyForDelivery': ['Delivered', 'OnHold', 'Cancelled'],
        'Delivered':      ['Completed'],
        'Completed':      [], 
        'OnHold':         ['Pending', 'Confirmed', 'InProduction', 'QualityCheck', 'ReadyForDelivery', 'Cancelled'],
        'Cancelled':      [], 
      };

      if (!validTransitions[fromStatus]?.includes(toStatus)) {
        throw new Error(`Invalid status transition from ${fromStatus} to ${toStatus}`);
      }

      const allowedTargets = {
        'Sales Staff': ['Confirmed', 'OnHold', 'Cancelled'],
        'Production Staff': ['InProduction', 'QualityCheck', 'ReadyForDelivery'],
        'Delivery Staff': ['Delivered']
      };
      
      const roleTargets = allowedTargets[user.role] || [];
      if (!roleTargets.includes(toStatus)) {
        throw new Error(`User role ${user.role} is not permitted to transition order to ${toStatus}`);
      }
    }

    if ((toStatus === 'Cancelled' || toStatus === 'OnHold') && (!data.reason || !data.reason.trim())) {
      throw new Error(`Reason is required when moving to ${toStatus}`);
    }

    const updateData = { orderStatus: toStatus };
    let paymentNote = '';
    if (data.paymentAmount) {
      const amount = parseFloat(data.paymentAmount);
      updateData.advanceAmount = order.advanceAmount + amount;
      updateData.balanceAmount = Math.max(0, order.balanceAmount - amount);
      paymentNote = `Payment received: ₹${amount} via ${data.paymentMode || 'Unknown'}`;
      if (data.paymentReference) paymentNote += ` (Ref: ${data.paymentReference})`;
    }

    const updatedOrder = await tx.order.update({
      where: { id },
      data: updateData
    });

    let finalNotes = data.notes || '';
    if (paymentNote) {
      finalNotes = finalNotes ? `${finalNotes} | ${paymentNote}` : paymentNote;
    }

    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        fromStatus,
        toStatus,
        changedBy: user.id,
        notes: finalNotes || null,
        reason: data.reason || null
      }
    });

    return updatedOrder;
  });
};

export const getOrderStatusHistory = async (id) => {
  return prisma.orderStatusHistory.findMany({
    where: { orderId: id },
    orderBy: { changedAt: 'desc' },
    include: {
      user: { select: { fullName: true, role: true } }
    }
  });
};
