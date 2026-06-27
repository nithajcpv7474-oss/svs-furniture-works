import { z } from 'zod';

const RoleEnum = z.enum(['Admin', 'Management', 'Sales Staff', 'Production Staff', 'Delivery Staff']);

export const createUserSchema = {
  body: z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    phone: z.string().regex(/^[0-9]{10}$/, "Phone number must contain exactly 10 digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: RoleEnum.default('Staff'),
    isActive: z.boolean().optional().default(true),
  })
};

export const updateUserSchema = {
  body: z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email format").optional(),
    phone: z.string().regex(/^[0-9]{10}$/, "Phone number must contain exactly 10 digits").optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    role: RoleEnum.optional(),
    isActive: z.boolean().optional(),
  })
};
