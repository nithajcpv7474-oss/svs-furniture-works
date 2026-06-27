import prisma from '../config/prisma.js';

export const createTransaction = async (data, createdBy) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch current material
    const material = await tx.material.findUnique({
      where: { id: data.materialId }
    });

    if (!material) {
      throw new Error('Material not found.');
    }

    const quantity = parseFloat(data.quantity);
    let newStock = material.availableStock;

    // 2. Calculate new stock based on transaction type
    if (data.transactionType === 'StockIn') {
      newStock += quantity;
    } else if (data.transactionType === 'StockOut') {
      if (material.availableStock < quantity) {
        throw new Error('Insufficient stock for this transaction.');
      }
      newStock -= quantity;
    } else if (data.transactionType === 'Adjustment') {
      // Adjustment directly sets the stock if we treat quantity as the diff, 
      // or we can treat quantity as the absolute diff (can be negative or positive).
      // Let's assume quantity is the positive/negative diff.
      newStock += quantity;
    }

    if (newStock < 0) {
      throw new Error('Stock cannot be negative.');
    }

    // 3. Record transaction
    const transaction = await tx.inventoryTransaction.create({
      data: {
        materialId: data.materialId,
        transactionType: data.transactionType,
        quantity: quantity,
        reference: data.reference,
        remarks: data.remarks,
        createdBy,
      }
    });

    // 4. Update material stock
    await tx.material.update({
      where: { id: data.materialId },
      data: { availableStock: newStock }
    });

    return transaction;
  });
};

export const getTransactions = async ({ skip, take, materialId, type }) => {
  const where = {};
  if (materialId) where.materialId = materialId;
  if (type) where.transactionType = type;

  const [transactions, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where,
      skip,
      take,
      include: { material: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.inventoryTransaction.count({ where })
  ]);

  return { transactions, total };
};
