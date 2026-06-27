import * as materialService from '../services/material.service.js';
import { logAction } from '../services/audit.service.js';

export const getMaterials = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, category, status } = req.query;

    const { materials, total } = await materialService.getMaterials({
      skip,
      take: limit,
      search,
      category,
      status,
    });

    res.status(200).json({
      data: materials,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('getMaterials Error:', error);
    res.status(500).json({ message: 'Failed to retrieve materials.' });
  }
};

export const getMaterialById = async (req, res) => {
  try {
    const material = await materialService.getMaterialById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found.' });
    }
    res.status(200).json(material);
  } catch (error) {
    console.error('getMaterialById Error:', error);
    res.status(500).json({ message: 'Failed to retrieve material.' });
  }
};

export const createMaterial = async (req, res) => {
  try {
    const material = await materialService.createMaterial(req.body, req.files);
    logAction({ userId: req.user.id, action: 'Create', module: 'Inventory', newValue: material, req });
    res.status(201).json(material);
  } catch (error) {
    console.error('createMaterial Error:', error);
    res.status(400).json({ message: error.message || 'Failed to create material.' });
  }
};

export const updateMaterial = async (req, res) => {
  try {
    const oldMaterial = await materialService.getMaterialById(req.params.id);
    const material = await materialService.updateMaterial(req.params.id, req.body, req.files);
    logAction({ userId: req.user.id, action: 'Update', module: 'Inventory', oldValue: oldMaterial, newValue: material, req });
    res.status(200).json(material);
  } catch (error) {
    console.error('updateMaterial Error:', error);
    res.status(500).json({ message: 'Failed to update material.' });
  }
};

export const deleteMaterial = async (req, res) => {
  try {
    const oldMaterial = await materialService.getMaterialById(req.params.id);
    await materialService.deleteMaterial(req.params.id);
    logAction({ userId: req.user.id, action: 'Delete', module: 'Inventory', oldValue: oldMaterial, req });
    res.status(200).json({ message: 'Material deleted successfully.' });
  } catch (error) {
    console.error('deleteMaterial Error:', error);
    res.status(500).json({ message: 'Failed to delete material.' });
  }
};
