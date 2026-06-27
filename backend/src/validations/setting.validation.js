import { z } from 'zod';

export const settingSchema = {
  body: z.object({
    companyName: z.string().min(2, "Company name must be at least 2 characters").optional(),
    companyEmail: z.string().email("Invalid company email format").optional(),
    companyPhone: z.string().optional().nullable(),
    companyAddress: z.string().optional().nullable(),
    gstin: z.string().optional().nullable(),
    
    currency: z.string().min(1, "Currency is required").optional(),
    taxRate: z.coerce.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100").optional(),
    
    lowStockThreshold: z.coerce.number().min(1).optional(),
    deliveryOverdueGraceHours: z.coerce.number().min(0).optional(),
    productionDelayGraceHours: z.coerce.number().min(0).optional(),
    
    enableLowStockAlerts: z.union([z.boolean(), z.string().transform(v => v === 'true')]).optional(),
    enableDeliveryAlerts: z.union([z.boolean(), z.string().transform(v => v === 'true')]).optional(),
    enableProductionAlerts: z.union([z.boolean(), z.string().transform(v => v === 'true')]).optional(),
    enableSpecificationAlerts: z.union([z.boolean(), z.string().transform(v => v === 'true')]).optional(),
    
    defaultExportFormat: z.string().optional(),
    dateFormat: z.string().optional()
  })
};
