import { z } from 'zod';

const CustomerTypeEnum = z.enum(['Retail', 'Dealer', 'InteriorDesigner', 'Export']);
const CustomerStatusEnum = z.enum(['Active', 'Inactive']);

export const customerSchema = {
  body: z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    phone: z.string().regex(/^[0-9]{10}$/, "Phone number must contain exactly 10 digits"),
    alternatePhone: z.string().optional().nullable().refine((val) => !val || /^[0-9]{10}$/.test(val), "Alternate phone number must contain exactly 10 digits"),
    email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
    companyName: z.string().optional().nullable(),
    gstNumber: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    pincode: z.string().optional().nullable(),
    customerType: CustomerTypeEnum.default('Retail'),
    status: CustomerStatusEnum.default('Active'),
    notes: z.string().optional().nullable(),
  })
};
