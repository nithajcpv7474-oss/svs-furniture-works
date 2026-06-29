import prisma from '../config/prisma.js';

// --- Vehicles ---
export const getVehicles = async ({ skip, take, search, status }) => {
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { vehicleNumber: { contains: search, mode: 'insensitive' } },
      { driverName: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.vehicle.count({ where })
  ]);

  return { vehicles, total };
};

export const getVehicleById = async (id) => {
  return prisma.vehicle.findUnique({ where: { id } });
};

export const createVehicle = async (data) => {
  return prisma.vehicle.create({ data });
};

export const updateVehicle = async (id, data) => {
  return prisma.vehicle.update({ where: { id }, data });
};

export const deleteVehicle = async (id) => {
  return prisma.vehicle.delete({ where: { id } });
};

// --- Deliveries ---
export const getDeliveries = async ({ skip, take, search, status, type, date }) => {
  const where = {};
  if (status) where.deliveryStatus = status;
  if (type) where.deliveryType = type;
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    where.expectedDeliveryDate = {
      gte: startOfDay,
      lte: endOfDay
    };
  }
  if (search) {
    where.OR = [
      { deliveryNumber: { contains: search, mode: 'insensitive' } },
      { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
      { customer: { fullName: { contains: search, mode: 'insensitive' } } },
      { receiverName: { contains: search, mode: 'insensitive' } },
      { transporterName: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [deliveries, total] = await Promise.all([
    prisma.delivery.findMany({
      where,
      skip,
      take,
      include: {
        order: { include: { customer: true } },
        customer: true,
        vehicle: true,
        history: { include: { user: { select: { fullName: true } } }, orderBy: { changedAt: 'desc' } }
      },
      orderBy: { expectedDeliveryDate: 'asc' }
    }),
    prisma.delivery.count({ where })
  ]);

  return { deliveries, total };
};

export const getDeliveryById = async (id) => {
  return prisma.delivery.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          customer: true,
          orderMaterials: { include: { material: true } }
        }
      },
      customer: true,
      vehicle: true,
      productionJob: true
    }
  });
};

export const createDelivery = async (data) => {
  const existingDelivery = await prisma.delivery.findUnique({
    where: { orderId: data.orderId }
  });

  if (existingDelivery) {
    throw new Error('A delivery already exists for this order.');
  }

  // Auto-generate DEL0001
  const lastDel = await prisma.delivery.findFirst({
    orderBy: { deliveryNumber: 'desc' }
  });

  let nextNum = 1;
  if (lastDel && lastDel.deliveryNumber.startsWith('DEL')) {
    const lastNumberStr = lastDel.deliveryNumber.replace('DEL', '');
    const lastNumber = parseInt(lastNumberStr, 10);
    if (!isNaN(lastNumber)) nextNum = lastNumber + 1;
  }
  const deliveryNumber = `DEL${nextNum.toString().padStart(4, '0')}`;

  const delivery = await prisma.delivery.create({
    data: {
      deliveryNumber,
      orderId: data.orderId,
      customerId: data.customerId,
      productionJobId: data.productionJobId,
      deliveryType: data.deliveryType || 'Local',
      deliveryStatus: 'Pending',
      expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
      deliveryAddress: data.deliveryAddress,
      receiverName: data.receiverName,
      receiverPhone: data.receiverPhone,
      deliveryRemarks: data.deliveryRemarks,
      shippingDocRef: data.shippingDocRef,
      destinationPort: data.destinationPort,
      transitTime: data.transitTime
    }
  });

  return delivery;
};

export const updateDelivery = async (id, data, files = null) => {
  const updateData = { ...data };

  // Status State Machine Logic handling
  if (data.deliveryStatus === 'OutForDelivery') {
    if (!updateData.dispatchDate) {
      updateData.dispatchDate = new Date();
    }
    // Set vehicle status to InUse if assigned
    if (data.vehicleId) {
      await prisma.vehicle.update({
        where: { id: data.vehicleId },
        data: { status: 'InUse' }
      });
    }
  }

  if (data.deliveryStatus === 'Delivered') {
    if (!updateData.actualDeliveryDate) {
      updateData.actualDeliveryDate = new Date();
    }
  }

  if (files?.proofOfDeliveryImage) {
    updateData.proofOfDeliveryImage = files.proofOfDeliveryImage[0].filename;
  }
  if (files?.customerSignature) {
    updateData.customerSignature = files.customerSignature[0].filename;
  }

  if (data.customerSignatureBase64) {
    delete updateData.customerSignatureBase64;
  }

  const delivery = await prisma.delivery.update({
    where: { id },
    data: updateData,
    include: { order: true, productionJob: true, vehicle: true }
  });

  // Automated Integration with Order and Production Job
  if (data.deliveryStatus === 'Delivered' || data.deliveryStatus === 'Completed') {
    await prisma.order.update({
      where: { id: delivery.orderId },
      data: { orderStatus: 'Delivered' }
    });
    
    // Ensure production job is also completed
    if (delivery.productionJob.status !== 'Completed') {
      await prisma.productionJob.update({
        where: { id: delivery.productionJobId },
        data: { status: 'Completed', actualCompletionDate: new Date() }
      });
    }

    // Release Vehicle
    if (delivery.vehicleId) {
      await prisma.vehicle.update({
        where: { id: delivery.vehicleId },
        data: { status: 'Available' }
      });
    }
  }

  return delivery;
};

export const updateDeliveryStatus = async (id, data, user) => {
  return await prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.findUnique({ where: { id }, include: { order: true } });
    if (!delivery) throw new Error('Delivery not found');

    const fromStatus = delivery.deliveryStatus;
    const toStatus = data.deliveryStatus;

    if (['Failed', 'Rescheduled', 'Returned'].includes(toStatus) && (!data.reason || !data.reason.trim())) {
      throw new Error(`Reason is required when moving to ${toStatus}`);
    }

    const updateData = {
      deliveryStatus: toStatus,
      transporterName: data.transporterName || delivery.transporterName,
      transporterContact: data.transporterContact || delivery.transporterContact,
      deliveryNotes: data.deliveryNotes || delivery.deliveryNotes,
    };

    if (data.scheduledDate) updateData.expectedDeliveryDate = new Date(data.scheduledDate);
    if (data.scheduledTimeSlot) updateData.scheduledTimeSlot = data.scheduledTimeSlot;

    if (toStatus === 'Failed') updateData.failureReason = data.reason;
    if (toStatus === 'Rescheduled') {
      updateData.rescheduleReason = data.reason;
      if (!data.scheduledDate) throw new Error('New date is required for rescheduling');
    }
    if (toStatus === 'Returned') updateData.returnReason = data.reason;

    if (toStatus === 'Dispatched') updateData.dispatchDate = new Date();
    if (toStatus === 'Delivered') updateData.actualDeliveryDate = new Date();

    const updatedDelivery = await tx.delivery.update({
      where: { id },
      data: updateData,
      include: { order: { include: { customer: true } } }
    });

    await tx.deliveryHistory.create({
      data: {
        deliveryId: id,
        fromStatus,
        toStatus,
        changedBy: user.id,
        notes: data.notes || null,
        reason: data.reason || null
      }
    });

    if (toStatus === 'Delivered') {
      await tx.order.update({
        where: { id: delivery.orderId },
        data: { orderStatus: 'Delivered' }
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: delivery.orderId,
          fromStatus: delivery.order.orderStatus,
          toStatus: 'Delivered',
          changedBy: user.id,
          notes: 'Order marked Delivered automatically from Delivery module'
        }
      });
    }

    return updatedDelivery;
  });
};

export const assignTransporter = async (id, data, user) => {
  return await prisma.delivery.update({
    where: { id },
    data: {
      transporterName: data.transporterName,
      transporterContact: data.transporterContact,
      expectedDeliveryDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
      scheduledTimeSlot: data.scheduledTimeSlot
    }
  });
};
