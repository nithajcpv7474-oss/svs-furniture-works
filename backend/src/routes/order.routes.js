import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder
} from '../controllers/order.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';
import { upload, optimizeImages } from '../middlewares/upload.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { orderSchema } from '../validations/order.validation.js';

const router = express.Router();

// Auth + RBAC — applied to ALL routes in this module
router.use(verifyToken);
router.use(requireRole(["Admin","Management","Sales Staff","Production Staff","Delivery Staff"]));


// Authenticate all routes

// Apply RBAC middleware to all routes in this module



// Multer upload fields for the images
const cpUpload = upload.fields([
  { name: 'designImage', maxCount: 1 }, 
  { name: 'referenceDrawing', maxCount: 1 }
]);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', cpUpload, optimizeImages, validate(orderSchema), createOrder);
router.put('/:id', cpUpload, optimizeImages, validate(orderSchema), updateOrder);
router.delete('/:id', deleteOrder);

export default router;
