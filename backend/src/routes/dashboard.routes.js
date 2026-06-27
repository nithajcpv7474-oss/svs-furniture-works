import express from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

import apicache from 'apicache';

const router = express.Router();

// Auth + RBAC — applied to ALL routes in this module
router.use(verifyToken);
router.use(requireRole(["Admin","Management","Sales Staff"]));


// Authenticate all routes

// Apply RBAC middleware to all routes in this module
const cache = apicache.middleware;

// Cache the dashboard summary for 5 minutes
router.get('/summary', cache('5 minutes'), getDashboardSummary);

export default router;
