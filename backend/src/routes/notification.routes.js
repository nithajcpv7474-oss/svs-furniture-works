import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Auth + RBAC — applied to ALL routes in this module
router.use(verifyToken);
router.use(requireRole(["Admin","Management","Sales Staff","Production Staff","Delivery Staff"]));


// Authenticate all routes

// Apply RBAC middleware to all routes in this module



router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.put('/mark-all-read', notificationController.markAllAsRead);

export default router;
