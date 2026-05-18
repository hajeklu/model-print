import { z } from "zod";

export const deliveryMethodSchema = z.enum(["standard", "express", "pickup"]);
export const paymentMethodSchema = z.enum(["bank_transfer", "cod", "card"]);

export const modelDetailsSchema = z.object({
  fileFormat: z.string().min(1).max(20),
  fileSizeBytes: z.number().int().positive(),
  scale: z.string().min(1).max(20),
  color: z.string().min(1).max(50),
  quality: z.enum(["standard", "detail"]),
  nozzleMm: z.union([z.literal(0.4), z.literal(0.2)]),
  bboxMm: z
    .object({
      x: z.number().nonnegative(),
      y: z.number().nonnegative(),
      z: z.number().nonnegative(),
    })
    .optional(),
  volumeCm3: z.number().nonnegative().optional(),
  estimatedMaterialGrams: z.number().int().nonnegative().optional(),
  estimatedFilamentMeters: z.number().nonnegative().optional(),
  estimatedPriceEur: z.number().int().nonnegative().optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(254),
  phone: z.string().max(40).optional(),
});

export const createOrderBodySchema = z.object({
  uploadId: z.string().uuid(),
  contact: contactSchema,
  address: z.string().max(500).optional(),
  model: modelDetailsSchema,
  notes: z.string().max(1000).optional(),
  reference: z.string().max(100).optional(),
});

export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;

export function buildCheckoutSnapshot(
  body: CreateOrderBody,
): Record<string, unknown> {
  return {
    contact: body.contact,
    address: body.address,
    model: body.model,
    notes: body.notes,
    reference: body.reference,
  };
}
