import { z } from 'zod';
export const stockStatusSchema = z.enum(['in_stock', 'limited', 'out_of_stock']);
export const productInputSchema = z.object({
    name: z.string().min(1, 'الاسم مطلوب'),
    price: z.coerce.number().min(0, 'السعر غير صحيح'),
    description: z.string().default(''),
    cpu: z.string().default(''),
    gpu: z.string().default(''),
    ram: z.string().default(''),
    storage: z.string().default(''),
    photos: z.array(z.string().url()).default([]),
    stockStatus: stockStatusSchema.default('in_stock'),
    discountBadge: z.string().optional().or(z.literal('')),
});
export const specTypeSchema = z.enum(['cpu', 'gpu', 'ram', 'storage']);
export const specOptionInputSchema = z.object({
    type: specTypeSchema,
    value: z.string().min(1, 'القيمة مطلوبة'),
});
export const orderStatusSchema = z.enum([
    'pending',
    'confirmed',
    'declined',
    'shipped',
    'completed',
]);
export const orderItemSchema = z.object({
    productId: z.string().min(1),
    name: z.string().min(1),
    price: z.coerce.number().min(0),
    qty: z.coerce.number().min(1),
});
export const orderInputSchema = z.object({
    customerName: z.string().min(1, 'الاسم مطلوب'),
    phone: z
        .string()
        .regex(/^01[0-9]{9}$/, 'رقم الهاتف غير صحيح'),
    address: z.string().default(''),
    governorate: z.string().default(''),
    deliveryMethod: z.enum(['shipping', 'pickup']),
    depositPhotoUrl: z.string().url().optional(),
    items: z.array(orderItemSchema).min(1, 'السلة فارغة'),
    total: z.coerce.number().min(0),
});
