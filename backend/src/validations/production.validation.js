import { z } from 'zod';

const ProductionStageEnum = z.enum([
  'MaterialAllocation', 'WoodCutting', 'Assembly', 
  'Finishing', 'Painting', 'Upholstery', 
  'QualityInspection', 'Packing', 'ReadyForDelivery'
]);

const JobStatusEnum = z.enum([
  'NotStarted', 'InProgress', 'OnHold', 'Completed', 'Cancelled'
]);

const TaskStatusEnum = z.enum(['Pending', 'InProgress', 'Completed']);
const PriorityEnum = z.enum(['Low', 'Medium', 'High', 'Urgent']);
const InspectionStatusEnum = z.enum(['Pending', 'Passed', 'Failed', 'NeedsRework']);

export const productionJobSchema = {
  body: z.object({
    orderId: z.string().uuid("Invalid order ID format"),
    productionStage: ProductionStageEnum.default('MaterialAllocation'),
    assignedEmployee: z.string().optional().nullable(),
    startDate: z.union([z.string().datetime(), z.string(), z.null()]).optional().transform(val => val ? new Date(val).toISOString() : null),
    expectedCompletionDate: z.union([z.string().datetime(), z.string(), z.null()]).optional().transform(val => val ? new Date(val).toISOString() : null),
    actualCompletionDate: z.union([z.string().datetime(), z.string(), z.null()]).optional().transform(val => val ? new Date(val).toISOString() : null),
    priority: PriorityEnum.default('Medium'),
    status: JobStatusEnum.default('NotStarted'),
    remarks: z.string().optional().nullable(),
  })
};

export const productionTaskSchema = {
  body: z.object({
    taskName: z.string().min(2, "Task name is required"),
    assignedTo: z.string().optional().nullable(),
    estimatedHours: z.coerce.number().min(0).optional().nullable(),
    actualHours: z.coerce.number().min(0).optional().nullable(),
    status: TaskStatusEnum.default('Pending'),
    remarks: z.string().optional().nullable(),
  })
};

export const qualityInspectionSchema = {
  body: z.object({
    inspectorName: z.string().optional().nullable(),
    inspectionDate: z.union([z.string().datetime(), z.string(), z.null()]).optional().transform(val => val ? new Date(val).toISOString() : null),
    inspectionStatus: InspectionStatusEnum.default('Pending'),
    remarks: z.string().optional().nullable(),
  })
};
