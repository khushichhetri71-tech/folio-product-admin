import { z } from 'zod';
import { emptyWorkspace } from './query';
import type { Workspace } from './types';
const storedProduct = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  price: z.number().finite().nonnegative(),
  stock: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5),
  thumbnail: z.string(),
  images: z.array(z.string()),
  reviews: z.array(
    z.object({
      rating: z.number(),
      comment: z.string(),
      date: z.string(),
      reviewerName: z.string(),
    }),
  ),
  brand: z.string().optional(),
  sku: z.string().optional(),
  warrantyInformation: z.string().optional(),
  shippingInformation: z.string().optional(),
  returnPolicy: z.string().optional(),
});
const workspaceSchema = z.object({
  added: z.array(storedProduct),
  updated: z.record(z.string(), storedProduct),
  deleted: z.array(z.number().int().positive()),
});
export function readWorkspace(raw: string | null): Workspace {
  if (!raw) return emptyWorkspace();
  return workspaceSchema.parse(JSON.parse(raw));
}
