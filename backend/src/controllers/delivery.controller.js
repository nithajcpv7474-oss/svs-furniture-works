import * as deliveryService from '../services/delivery.service.js';
import { logAction } from '../services/audit.service.js';

// --- Vehicles ---
export const getVehicles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search, status } = req.query;

    const { vehicles, total } = await deliveryService.getVehicles({ skip, take: limit, search, status });

    res.json({
      data: vehicles,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await deliveryService.getVehicleById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createVehicle = async (req, res) => {
  try {
    const vehicle = await deliveryService.createVehicle(req.body);
    logAction({ userId: req.user.id, action: 'Create', module: 'Delivery', newValue: vehicle, req });
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const oldVehicle = await deliveryService.getVehicleById(req.params.id);
    const vehicle = await deliveryService.updateVehicle(req.params.id, req.body);
    logAction({ userId: req.user.id, action: 'Update', module: 'Delivery', oldValue: oldVehicle, newValue: vehicle, req });
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const oldVehicle = await deliveryService.getVehicleById(req.params.id);
    await deliveryService.deleteVehicle(req.params.id);
    logAction({ userId: req.user.id, action: 'Delete', module: 'Delivery', oldValue: oldVehicle, req });
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- Deliveries ---
export const getDeliveries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search, status, type, date } = req.query;

    const { deliveries, total } = await deliveryService.getDeliveries({ skip, take: limit, search, status, type, date });

    res.json({
      data: deliveries,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDeliveryById = async (req, res) => {
  try {
    const delivery = await deliveryService.getDeliveryById(req.params.id);
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
    res.json(delivery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createDelivery = async (req, res) => {
  try {
    const delivery = await deliveryService.createDelivery(req.body);
    logAction({ userId: req.user.id, action: 'Create', module: 'Delivery', newValue: delivery, req });
    res.status(201).json(delivery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateDelivery = async (req, res) => {
  try {
    const files = req.files;
    const oldDelivery = await deliveryService.getDeliveryById(req.params.id);
    const delivery = await deliveryService.updateDelivery(req.params.id, req.body, files);
    logAction({ userId: req.user.id, action: 'Update', module: 'Delivery', oldValue: oldDelivery, newValue: delivery, req });
    res.json(delivery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const delivery = await deliveryService.updateDeliveryStatus(req.params.id, req.body, req.user);
    logAction({ userId: req.user.id, action: 'UpdateStatus', module: 'Delivery', newValue: { id: req.params.id, status: req.body.deliveryStatus }, req });
    res.json(delivery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const assignTransporter = async (req, res) => {
  try {
    const delivery = await deliveryService.assignTransporter(req.params.id, req.body, req.user);
    logAction({ userId: req.user.id, action: 'AssignTransporter', module: 'Delivery', newValue: { id: req.params.id, transporter: req.body.transporterName }, req });
    res.json(delivery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
