import { z } from 'zod';

const DeliveryStatusEnum = z.enum(['Pending', 'Dispatched', 'InTransit', 'Delivered', 'Returned', 'Cancelled']);
const VehicleStatusEnum = z.enum(['Available', 'InUse', 'Maintenance']);

export const vehicleSchema = {
  body: z.object({
    vehicleNumber: z.string().min(2, "Vehicle number is required"),
    vehicleType: z.string().optional().nullable(),
    driverName: z.string().optional().nullable(),
    driverPhone: z.string().optional().nullable(),
    capacity: z.string().optional().nullable(),
    status: VehicleStatusEnum.default('Available'),
  })
};

export const deliverySchema = {
  body: z.object({
    orderId: z.string().uuid("Invalid order ID format"),
    customerId: z.string().uuid("Invalid customer ID format"),
    productionJobId: z.string().uuid("Invalid production job ID format"),
    vehicleId: z.union([z.string().uuid(), z.literal(""), z.null()]).optional(),
    deliveryStatus: DeliveryStatusEnum.default('Pending'),
    dispatchDate: z.union([z.string().datetime(), z.string(), z.null()]).optional().transform(val => val ? new Date(val).toISOString() : null),
    expectedDeliveryDate: z.union([z.string().datetime(), z.string(), z.null()]).optional().transform(val => val ? new Date(val).toISOString() : null),
    actualDeliveryDate: z.union([z.string().datetime(), z.string(), z.null()]).optional().transform(val => val ? new Date(val).toISOString() : null),
    deliveryAddress: z.string().optional().nullable(),
    receiverName: z.string().optional().nullable(),
    receiverPhone: z.string().optional().nullable(),
    deliveryRemarks: z.string().optional().nullable(),
    customerSignature: z.string().optional().nullable(),
  })
};
