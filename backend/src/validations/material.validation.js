import { z } from 'zod';

const MaterialStatusEnum = z.enum(['Active', 'Inactive', 'Discontinued']);

export const materialSchema = {
  body: z.object({
    materialName: z.string().min(2, "Material name is required"),
    category: z.string().min(2, "Category is required"),
    brand: z.string().optional().nullable(),
    unit: z.string().min(1, "Unit is required").default("Pieces"),
    availableStock: z.coerce.number().min(0, "Available stock cannot be negative").default(0),
    minimumStock: z.coerce.number().min(0).default(0),
    reorderLevel: z.coerce.number().min(0).default(0),
    purchasePrice: z.coerce.number().min(0).default(0),
    sellingPrice: z.coerce.number().min(0).optional().nullable(),
    supplierName: z.string().optional().nullable(),
    warehouseLocation: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    status: MaterialStatusEnum.default('Active'),
  })
};
