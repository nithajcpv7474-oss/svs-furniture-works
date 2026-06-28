import * as orderService from '../services/order.service.js';
import { notifyNewOrder, notifyCompletedOrder, notifyOrderStatusChange } from '../services/notification.service.js';
import { logAction } from '../services/audit.service.js';
import { getPaginationParams, formatPaginationResponse } from '../utils/pagination.util.js';

export const getOrders = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, status, priority } = req.query;

    const { orders, total } = await orderService.getOrders({
      skip,
      take: limit,
      search,
      status,
      priority,
    });

    res.status(200).json({
      data: orders,
      meta: formatPaginationResponse(total, page, limit),
    });
  } catch (error) {
    console.error('getOrders Error:', error);
    res.status(500).json({ message: 'Failed to retrieve orders.' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error('getOrderById Error:', error);
    res.status(500).json({ message: 'Failed to retrieve order.' });
  }
};

export const createOrder = async (req, res) => {
  try {
    // req.userId should be attached by the auth middleware if needed
    const createdBy = req.user ? req.user.id : null;
    const order = await orderService.createOrder(req.body, req.files, createdBy);
    // Fire notification (non-blocking)
    notifyNewOrder(order);
    logAction({ userId: req.user.id, action: 'Create', module: 'Orders', newValue: order, req });
    res.status(201).json(order);
  } catch (error) {
    console.error('createOrder Error:', error);
    if (error.name === 'PrismaClientValidationError') {
      return res.status(400).json({ message: 'Validation failed. Please ensure all required fields are provided correctly.' });
    }
    if (error.message) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to create order due to a server error.' });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const oldOrder = await orderService.getOrderById(req.params.id);
    const order = await orderService.updateOrder(req.params.id, req.body, req.files);
    // Fire status change notifications (non-blocking)
    if (req.body.orderStatus) {
      notifyOrderStatusChange(order, req.body.orderStatus);
      if (['Completed', 'Delivered'].includes(req.body.orderStatus)) {
        notifyCompletedOrder(order);
      }
    }
    logAction({ userId: req.user.id, action: 'Update', module: 'Orders', oldValue: oldOrder, newValue: order, req });
    res.status(200).json(order);
  } catch (error) {
    console.error('updateOrder Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Order not found.' });
    }
    res.status(500).json({ message: 'Failed to update order.' });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const oldOrder = await orderService.getOrderById(req.params.id);
    await orderService.deleteOrder(req.params.id);
    logAction({ userId: req.user.id, action: 'Delete', module: 'Orders', oldValue: oldOrder, req });
    res.status(200).json({ message: 'Order deleted successfully.' });
  } catch (error) {
    console.error('deleteOrder Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Order not found.' });
    }
    res.status(500).json({ message: 'Failed to delete order.' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, notes, reason, paymentAmount, paymentMode, paymentReference } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });

    const order = await orderService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const updatedOrder = await orderService.updateOrderStatus(req.params.id, {
      status, notes, reason, paymentAmount, paymentMode, paymentReference
    }, req.user);

    await notifyOrderStatusChange(updatedOrder, status, reason);
    logAction({ userId: req.user.id, action: 'Update Status', module: 'Orders', oldValue: { status: order.orderStatus }, newValue: { status }, req });

    res.status(200).json({ message: 'Order status updated successfully', data: updatedOrder });
  } catch (error) {
    console.error('updateOrderStatus Error:', error);
    res.status(400).json({ message: error.message || 'Failed to update order status' });
  }
};

export const getOrderStatusHistory = async (req, res) => {
  try {
    const history = await orderService.getOrderStatusHistory(req.params.id);
    res.status(200).json({ data: history });
  } catch (error) {
    console.error('getOrderStatusHistory Error:', error);
    res.status(500).json({ message: 'Failed to fetch status history' });
  }
};
