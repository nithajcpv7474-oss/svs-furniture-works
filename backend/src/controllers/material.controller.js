import * as materialService from '../services/material.service.js';
import { logAction } from '../services/audit.service.js';
import prisma from '../config/prisma.js';

export const getMaterials = async (req, res) => {
  try {
    const materialsData = await prisma.material.findMany({
      where: {
        isDeleted: false,
        status: 'Active'
      },
      select: {
        id: true,
        materialName: true,
        unit: true,
        category: true,
      },
      orderBy: { materialName: 'asc' },
    });

    const materials = materialsData.map(m => ({
      id: m.id,
      name: m.materialName,
      unit: m.unit,
      category: m.category,
    }));

    return res.status(200).json({
      success: true,
      data: materials,
    });
  } catch (error) {
    console.error('getMaterials Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const seedMaterials = async (req, res) => {
  try {
    const materialsData = [
      { name: 'Teak Wood', unit: 'kg', category: 'Wood' },
      { name: 'Plywood 18mm', unit: 'sheets', category: 'Wood' },
      { name: 'MDF Board 18mm', unit: 'sheets', category: 'Wood' },
      { name: 'Fabric - Cotton', unit: 'meters', category: 'Upholstery' },
      { name: 'Foam - High Density', unit: 'kg', category: 'Upholstery' },
      { name: 'Wood Screws M6', unit: 'pieces', category: 'Hardware' },
      { name: 'Soft Close Hinge', unit: 'pieces', category: 'Hardware' },
      { name: 'Drawer Slider 18 inch', unit: 'pairs', category: 'Hardware' },
      { name: 'Wood Polish - Clear', unit: 'liters', category: 'Finishing' },
      { name: 'Wood Stain - Walnut', unit: 'liters', category: 'Finishing' },
    ];

    let mCode = 11000;
    const toInsert = [];
    
    for (const mat of materialsData) {
      const existing = await prisma.material.findFirst({
        where: { materialName: mat.name }
      });
      if (!existing) {
        toInsert.push({
          materialCode: `MAT-${mCode++}`,
          materialName: mat.name,
          category: mat.category,
          unit: mat.unit,
          minimumStock: 10,
          reorderLevel: 20,
          purchasePrice: 100,
          availableStock: 100,
          status: 'Active',
          isDeleted: false
        });
      }
    }

    if (toInsert.length > 0) {
      await prisma.material.createMany({
        data: toInsert,
        skipDuplicates: true
      });
    }

    return res.status(200).json({ success: true, seeded: toInsert.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
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
