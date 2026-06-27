import { z } from 'zod';

const TransactionTypeEnum = z.enum(['StockIn', 'StockOut', 'Adjustment']);

export const inventoryTransactionSchema = {
  body: z.object({
    materialId: z.string().uuid("Invalid material ID format"),
    transactionType: TransactionTypeEnum,
    quantity: z.coerce.number(), // Can be negative for adjustments
    reference: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
  })
};
