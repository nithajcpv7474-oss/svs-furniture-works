import * as productionService from '../services/production.service.js';
import { logAction } from '../services/audit.service.js';

export const getProductionJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, status, stage } = req.query;

    const { jobs, total } = await productionService.getProductionJobs({ skip, take: limit, search, status, stage });

    res.json({
      data: jobs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductionJobById = async (req, res) => {
  try {
    const job = await productionService.getProductionJobById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Production job not found' });
    
    if (req.user?.role === 'ProductionStaff' && job.order) {
      delete job.order.estimatedPrice;
      delete job.order.advanceAmount;
      delete job.order.balanceAmount;
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProductionJob = async (req, res) => {
  try {
    // Pass req.user.id if available for tracking who started production
    const createdBy = req.user ? req.user.id : null;
    const job = await productionService.createProductionJob(req.body, createdBy);
    logAction({ userId: req.user?.id, action: 'Create', module: 'Production', newValue: job, req });
    res.status(201).json(job);
  } catch (error) {
    if (error.message === 'INSUFFICIENT_STOCK') {
      const shortageDetails = error.shortages.map(s => `${s.materialName} (Needs: ${s.required}, Has: ${s.available})`).join(', ');
      return res.status(400).json({ 
        message: `Insufficient stock to start production. Shortages: ${shortageDetails}`, 
        shortages: error.shortages 
      });
    }
    res.status(400).json({ message: error.message });
  }
};

export const updateProductionJob = async (req, res) => {
  try {
    const oldJob = await productionService.getProductionJobById(req.params.id);
    const job = await productionService.updateProductionJob(req.params.id, req.body);
    logAction({ userId: req.user.id, action: 'Update', module: 'Production', oldValue: oldJob, newValue: job, req });
    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const advanceStage = async (req, res) => {
  try {
    const { stage } = req.body;
    const oldJob = await productionService.getProductionJobById(req.params.id);
    const job = await productionService.advanceStage(req.params.id, stage, req.user);
    logAction({ userId: req.user.id, action: 'StageAdvance', module: 'Production', oldValue: oldJob, newValue: job, req });
    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const assignWorker = async (req, res) => {
  try {
    const { assignedEmployee } = req.body;
    const oldJob = await productionService.getProductionJobById(req.params.id);
    const job = await productionService.assignWorker(req.params.id, assignedEmployee);
    logAction({ userId: req.user.id, action: 'AssignWorker', module: 'Production', oldValue: oldJob, newValue: job, req });
    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createProductionTask = async (req, res) => {
  try {
    const task = await productionService.createProductionTask(req.params.id, req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProductionTask = async (req, res) => {
  try {
    const task = await productionService.updateProductionTask(req.params.taskId, req.body);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProductionTask = async (req, res) => {
  try {
    await productionService.deleteProductionTask(req.params.taskId);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createQualityInspection = async (req, res) => {
  try {
    const inspection = await productionService.createQualityInspection(req.params.id, req.body);
    res.status(201).json(inspection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
