import express from 'express';
import * as reportController from '../controllers/report.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

import apicache from 'apicache';

const router = express.Router();

// Auth + RBAC — applied to ALL routes in this module
router.use(verifyToken);
router.use(requireRole(["Admin","Management"]));


// Authenticate all routes

// Apply RBAC middleware to all routes in this module

const cache = apicache.middleware;

// Cache reports for 5 minutes
router.use(cache('5 minutes'));

router.get('/dashboard-charts', reportController.getDashboardCharts);
router.get('/sales', reportController.getSalesReports);
router.get('/inventory', reportController.getInventoryReports);
router.get('/production', reportController.getProductionReports);
router.get('/delivery', reportController.getDeliveryReports);

export default router;
