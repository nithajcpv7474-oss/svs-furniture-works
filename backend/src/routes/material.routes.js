import express from 'express';
import {
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  seedMaterials
} from '../controllers/material.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';
import { upload, optimizeImages } from '../middlewares/upload.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { materialSchema } from '../validations/material.validation.js';

const router = express.Router();

router.get('/seed', seedMaterials);

// Auth + RBAC — applied to ALL routes in this module
router.use(verifyToken);
router.use(requireRole(["Admin","Management"]));


// Authenticate all routes

// Apply RBAC middleware to all routes in this module



const cpUpload = upload.fields([
  { name: 'image', maxCount: 1 }
]);

router.get('/', getMaterials);
router.get('/:id', getMaterialById);
router.post('/', cpUpload, optimizeImages, validate(materialSchema), createMaterial);
router.put('/:id', cpUpload, optimizeImages, validate(materialSchema), updateMaterial);
router.delete('/:id', deleteMaterial);

export default router;
