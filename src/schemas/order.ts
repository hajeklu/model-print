import { z } from "zod";

export const deliveryMethodSchema = z.enum(["standard", "express", "pickup"]);
export const paymentMethodSchema = z.enum(["bank_transfer", "cod", "card"]);

export const shippingAddressSchema = z.object({
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2).toUpperCase(),
});

export const contactSchema = z.object({
  email: z.string().email().max(254),
  phone: z.string().max(40).optional(),
});

export const createOrderBodySchema = z.object({
  uploadId: z.string().uuid(),
  contact: contactSchema,
  shippingAddress: shippingAddressSchema,
  deliveryMethod: deliveryMethodSchema,
  paymentMethod: paymentMethodSchema,
  notes: z.string().max(2000).optional(),
  reference: z.string().max(100).optional(),
});

export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;

export function buildCheckoutSnapshot(
  body: CreateOrderBody,
): Record<string, unknown> {
  return {
    contact: body.contact,
    shippingAddress: body.shippingAddress,
    deliveryMethod: body.deliveryMethod,
    paymentMethod: body.paymentMethod,
    notes: body.notes,
    reference: body.reference,
  };
}
