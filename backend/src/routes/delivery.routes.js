import express from 'express';
import * as deliveryController from '../controllers/delivery.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';
import { upload, optimizeImages } from '../middlewares/upload.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { vehicleSchema, deliverySchema } from '../validations/delivery.validation.js';

const router = express.Router();

// Auth + RBAC — applied to ALL routes in this module
router.use(verifyToken);
router.use(requireRole(["Admin","Management","Delivery Staff"]));


// Authenticate all routes

// Apply RBAC middleware to all routes in this module



// Vehicles
router.get('/vehicles', deliveryController.getVehicles);
router.get('/vehicles/:id', deliveryController.getVehicleById);
router.post('/vehicles', validate(vehicleSchema), deliveryController.createVehicle);
router.put('/vehicles/:id', validate(vehicleSchema), deliveryController.updateVehicle);
router.delete('/vehicles/:id', deliveryController.deleteVehicle);

// Deliveries
router.get('/', deliveryController.getDeliveries);
router.get('/:id', deliveryController.getDeliveryById);
router.post('/', validate(deliverySchema), deliveryController.createDelivery);

// For update we can upload proofOfDeliveryImage and customerSignature
router.put('/:id', 
  upload.fields([
    { name: 'proofOfDeliveryImage', maxCount: 1 },
    { name: 'customerSignature', maxCount: 1 }
  ]), 
  optimizeImages,
  validate(deliverySchema),
  deliveryController.updateDelivery
);

export default router;
