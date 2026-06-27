import express from 'express';
import * as customerController from '../controllers/customer.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { customerSchema } from '../validations/customer.validation.js';

const router = express.Router();

// Auth + RBAC — applied to ALL routes in this module
router.use(verifyToken);
router.use(requireRole(["Admin","Management","Sales Staff"]));


// Authenticate all routes

// Apply RBAC middleware to all routes in this module


// Apply auth middleware to all routes

router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', validate(customerSchema), customerController.createCustomer);
router.put('/:id', validate(customerSchema), customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

export default router;
