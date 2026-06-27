import { z } from 'zod';

const OrderStatusEnum = z.enum([
  'Pending', 'Confirmed', 'InProduction', 
  'QualityCheck', 'ReadyForDelivery', 'Delivered', 'Cancelled'
]);

const PriorityEnum = z.enum(['Low', 'Medium', 'High', 'Urgent']);

export const orderSchema = {
  body: z.object({
    customerId: z.string().uuid("Invalid customer ID format"),
    furnitureCategory: z.string().min(2, "Category is required"),
    furnitureName: z.string().min(2, "Furniture name is required"),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
    length: z.coerce.number().min(0).optional().nullable(),
    width: z.coerce.number().min(0).optional().nullable(),
    height: z.coerce.number().min(0).optional().nullable(),
    measurementUnit: z.string().optional().nullable(),
    woodMaterial: z.string().optional().nullable(),
    finishType: z.string().optional().nullable(),
    hardwareDetails: z.string().optional().nullable(),
    upholsteryRequired: z.coerce.boolean().optional().default(false),
    upholsteryMaterial: z.string().optional().nullable(),
    upholsteryColor: z.string().optional().nullable(),
    polishColor: z.string().optional().nullable(),
    glassRequired: z.coerce.boolean().optional().default(false),
    glassType: z.string().optional().nullable(),
    accessories: z.string().optional().nullable(),
    estimatedPrice: z.coerce.number().min(0, "Estimated price cannot be negative"),
    advanceAmount: z.coerce.number().min(0).optional().default(0),
    balanceAmount: z.coerce.number().min(0, "Balance amount cannot be negative"),
    expectedDeliveryDate: z.union([z.string().datetime(), z.string(), z.null()]).optional().transform(val => val ? new Date(val).toISOString() : null),
    deliveryAddress: z.string().optional().nullable(),
    specialInstructions: z.string().optional().nullable(),
    orderStatus: OrderStatusEnum.default('Pending'),
    priority: PriorityEnum.default('Medium'),
    materials: z.string().optional().nullable(), // Sent as JSON string in form-data
  })
};
