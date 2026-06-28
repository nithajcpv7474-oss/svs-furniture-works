import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

import { jobQueue } from './jobQueue.service.js';

/**
 * Dispatch a notification to the background queue.
 * @param {Object} data - { title, message, type, priority, userId, referenceId }
 */
export const createNotification = ({ title, message, type = 'SYSTEM', priority = 'medium', userId = null, referenceId = null }) => {
  jobQueue.dispatchNotification({ title, message, type, priority, userId, referenceId });
  return true;
};

// Internal function used by the JobQueue to perform the actual DB write
export const processNotificationJob = async (data) => {
  try {
    await prisma.notification.create({ data });
    logger.info(`Notification created: [${data.type}] ${data.title}`);
  } catch (error) {
    logger.error(`Failed to create notification: ${error.message}`);
  }
};

/**
 * Get all notifications for a user (including broadcasts where userId is null).
 */
export const getNotifications = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const where = {
    OR: [
      { userId: userId },
      { userId: null } // Broadcast notifications
    ]
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        ...where,
        isRead: false
      }
    })
  ]);

  return {
    notifications,
    unreadCount,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
};

/**
 * Get unread count for a user.
 */
export const getUnreadCount = async (userId) => {
  return prisma.notification.count({
    where: {
      OR: [{ userId }, { userId: null }],
      isRead: false
    }
  });
};

/**
 * Mark a single notification as read.
 */
export const markAsRead = async (notificationId) => {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true }
  });
};

/**
 * Mark all notifications for a user as read.
 */
export const markAllAsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: {
      OR: [{ userId }, { userId: null }],
      isRead: false
    },
    data: { isRead: true }
  });
};

// ─── Auto-notification helper functions ─────────────────────────────

export const notifyNewOrder = async (order) => {
  return createNotification({
    title: 'New Order Received',
    message: `Order ${order.orderNumber} placed for ${order.furnitureName} worth ₹${order.estimatedPrice?.toLocaleString()}`,
    type: 'NEW_ORDER',
    priority: 'medium',
    referenceId: order.id
  });
};

export const notifyCompletedOrder = async (order) => {
  return createNotification({
    title: 'Order Completed',
    message: `Order ${order.orderNumber} (${order.furnitureName}) has been completed successfully.`,
    type: 'COMPLETED_ORDER',
    priority: 'low',
    referenceId: order.id
  });
};

export const notifyOrderStatusChange = async (order, newStatus, reason = null) => {
  let message = '';
  const customerName = order.customer ? order.customer.fullName : 'Customer';
  
  switch(newStatus) {
    case 'Confirmed': message = `${order.orderNumber} confirmed — production can begin`; break;
    case 'InProduction': message = `${order.orderNumber} is now in production`; break;
    case 'QualityCheck': message = `${order.orderNumber} is ready for quality inspection`; break;
    case 'ReadyForDelivery': message = `${order.orderNumber} is ready for delivery`; break;
    case 'Delivered': message = `${order.orderNumber} has been delivered to ${customerName}`; break;
    case 'Completed': message = `${order.orderNumber} is completed — full payment received`; break;
    case 'OnHold': message = `${order.orderNumber} is on hold — ${reason || 'No reason provided'}`; break;
    case 'Cancelled': message = `${order.orderNumber} has been cancelled — ${reason || 'No reason provided'}`; break;
    default: message = `Order ${order.orderNumber} status changed to ${newStatus}`;
  }

  const rolesToNotify = ['Admin', 'Management'];
  if (['Confirmed', 'Delivered', 'Completed', 'Cancelled'].includes(newStatus)) rolesToNotify.push('Sales Staff');
  if (['InProduction', 'QualityCheck', 'ReadyForDelivery'].includes(newStatus)) rolesToNotify.push('Production Staff');
  if (['ReadyForDelivery', 'Delivered'].includes(newStatus)) rolesToNotify.push('Delivery Staff');

  const users = await prisma.user.findMany({
    where: { role: { in: rolesToNotify }, isActive: true },
    select: { id: true }
  });

  const promises = users.map(user => 
    createNotification({
      title: 'Order Status Updated',
      message,
      type: 'ORDER_STATUS_CHANGE',
      priority: ['Cancelled', 'OnHold'].includes(newStatus) ? 'high' : 'medium',
      referenceId: order.id,
      userId: user.id
    })
  );

  await Promise.all(promises);
  return true;
};

export const notifyLowStock = async (material) => {
  return createNotification({
    title: 'Low Stock Alert',
    message: `${material.materialName} (${material.materialCode}) is below minimum stock. Available: ${material.availableStock}, Minimum: ${material.minimumStock}`,
    type: 'LOW_STOCK',
    priority: 'high',
    referenceId: material.id
  });
};

export const notifyDelayedProduction = async (job) => {
  return createNotification({
    title: 'Production Delayed',
    message: `Production job ${job.productionNumber} has exceeded its expected completion date.`,
    type: 'DELAYED_PRODUCTION',
    priority: 'critical',
    referenceId: job.id
  });
};

export const notifyLateDelivery = async (delivery) => {
  return createNotification({
    title: 'Delivery Overdue',
    message: `Delivery ${delivery.deliveryNumber} has passed its expected delivery date.`,
    type: 'LATE_DELIVERY',
    priority: 'critical',
    referenceId: delivery.id
  });
};

export const notifyUserCreated = async (newUser) => {
  return createNotification({
    title: 'New User Created',
    message: `${newUser.fullName} (${newUser.email}) has been added as ${newUser.role}.`,
    type: 'USER_CREATED',
    priority: 'low',
    referenceId: newUser.id
  });
};
