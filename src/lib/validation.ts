import { z } from 'zod';
export const productSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Enter at least 2 characters.')
    .max(120, 'Use 120 characters or fewer.'),
  description: z
    .string()
    .trim()
    .min(10, 'Enter at least 10 characters.')
    .max(2000, 'Use 2,000 characters or fewer.'),
  category: z
    .string()
    .trim()
    .min(1, 'Choose a category.')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Choose a valid category.'),
  price: z
    .number()
    .finite()
    .min(0.01, 'Price must be greater than zero.')
    .max(1000000, 'Price must be below ₹10,00,000.'),
  stock: z
    .number()
    .int('Stock must be a whole number.')
    .min(0, 'Stock cannot be negative.')
    .max(1000000),
  rating: z.number().min(0).max(5),
});
export type ProductInput = z.infer<typeof productSchema>;
export const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});
export function safeReturnPath(value: string | null) {
  return value && /^\/products(?:\/\d+)?(?:\?[^\\]*)?$/.test(value) ? value : '/products';
}
