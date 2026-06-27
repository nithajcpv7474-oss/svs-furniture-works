import express from 'express';
import * as auditController from '../controllers/audit.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Auth + RBAC — applied to ALL routes in this module
router.use(verifyToken);
router.use(requireRole(["Admin"]));


// Authenticate all routes

// Apply RBAC middleware to all routes in this module



// Audit logs should ideally be viewable only by Admins
router.get('/', auditController.getAuditLogs);
router.get('/export/pdf', auditController.exportPdf);
router.post('/log-export', auditController.logClientExport);

export default router;
