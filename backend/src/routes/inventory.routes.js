import express from 'express';
import { createTransaction, getTransactions } from '../controllers/inventory.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { inventoryTransactionSchema } from '../validations/inventory.validation.js';

const router = express.Router();

// Auth + RBAC — applied to ALL routes in this module
router.use(verifyToken);
router.use(requireRole(["Admin","Management"]));


// Authenticate all routes

// Apply RBAC middleware to all routes in this module



router.get('/transactions', getTransactions);
router.post('/transactions', validate(inventoryTransactionSchema), createTransaction);

export default router;
