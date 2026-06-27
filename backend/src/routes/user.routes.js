import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createUserSchema, updateUserSchema } from '../validations/user.validation.js';

const router = express.Router();

// Auth + RBAC — applied to ALL routes in this module
router.use(verifyToken);
router.use(requireRole(["Admin"]));


// Authenticate all routes

// Apply RBAC middleware to all routes in this module



// User preferences (Any authenticated user can update their own)
router.put('/me/preferences', userController.updatePreferences);

// Admin only routes for user management
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', validate(createUserSchema), userController.createUser);
router.put('/:id', validate(updateUserSchema), userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Password reset by admin/management
router.post('/:id/reset-password', userController.resetPassword);

export default router;
