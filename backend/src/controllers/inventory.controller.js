import * as inventoryService from '../services/inventory.service.js';
import prisma from '../config/prisma.js';
import { notifyLowStock } from '../services/notification.service.js';
import { logAction } from '../services/audit.service.js';

export const createTransaction = async (req, res) => {
  try {
    const createdBy = req.user ? req.user.id : null;
    const transaction = await inventoryService.createTransaction(req.body, createdBy);
    
    // Check if material is now below minimum stock
    if (req.body.materialId) {
      const material = await prisma.material.findUnique({ where: { id: req.body.materialId } });
      if (material && material.availableStock <= material.minimumStock) {
        notifyLowStock(material);
      }
    }
    
    logAction({ userId: req.user.id, action: 'Create', module: 'Inventory', newValue: transaction, req });
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('createTransaction Error:', error);
    res.status(400).json({ message: error.message || 'Failed to process transaction.' });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { materialId, type } = req.query;

    const { transactions, total } = await inventoryService.getTransactions({
      skip,
      take: limit,
      materialId,
      type
    });

    res.status(200).json({
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('getTransactions Error:', error);
    res.status(500).json({ message: 'Failed to retrieve transactions.' });
  }
};
