import express from 'express';
import * as settingController from '../controllers/setting.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { settingSchema } from '../validations/setting.validation.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

// Auth + RBAC — applied to ALL routes in this module
router.use(verifyToken);
router.use(requireRole(["Admin","Management"]));


// Authenticate all routes

// Apply RBAC middleware to all routes in this module



// Any authenticated user can view settings
router.get('/', settingController.getSettings);

// Only Admins can update settings
router.put('/', upload.single('companyLogo'), validate(settingSchema), settingController.updateSettings);

export default router;
