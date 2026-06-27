import express from 'express';
import * as productionController from '../controllers/production.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { productionJobSchema, productionTaskSchema, qualityInspectionSchema } from '../validations/production.validation.js';

const router = express.Router();

// Auth + RBAC — applied to ALL routes in this module
router.use(verifyToken);
router.use(requireRole(["Admin","Management","Production Staff"]));


// Authenticate all routes

// Apply RBAC middleware to all routes in this module



// Jobs
router.get('/', productionController.getProductionJobs);
router.post('/', validate(productionJobSchema), productionController.createProductionJob);
router.get('/:id', productionController.getProductionJobById);
router.put('/:id', validate(productionJobSchema), productionController.updateProductionJob);
router.put('/:id/stage', productionController.advanceStage);
router.put('/:id/assign', productionController.assignWorker);

// Tasks
router.post('/:id/tasks', validate(productionTaskSchema), productionController.createProductionTask);
router.put('/tasks/:taskId', validate(productionTaskSchema), productionController.updateProductionTask);
router.delete('/tasks/:taskId', productionController.deleteProductionTask);

// Inspections
router.post('/:id/inspections', validate(qualityInspectionSchema), productionController.createQualityInspection);

export default router;
