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
    quantity: z.coerce.number().min(0).optional(),
    discountBadge: z.string().optional().or(z.literal('')),
    visible: z.boolean().default(true),
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
export const paymentMethodSchema = z.enum(['vodafone_cash', 'instapay']);
export const paymentStatusSchema = z.enum(['pending_verification', 'confirmed', 'rejected']);
export const selectedAddonSchema = z.object({
    addonId: z.string().min(1),
    name: z.string().min(1).optional(),
    price: z.coerce.number().min(0).optional(),
    qty: z.coerce.number().min(1).default(1),
});
export const orderItemSchema = z.object({
    productId: z.string().min(1),
    itemType: z.enum(['laptop', 'accessory']).default('laptop'),
    name: z.string().min(1),
    price: z.coerce.number().min(0),
    priceAtOrder: z.coerce.number().min(0).optional(),
    qty: z.coerce.number().min(1),
    selectedAddons: z.array(selectedAddonSchema).default([]),
});
export const orderInputSchema = z.object({
    customerName: z.string().min(1, 'الاسم مطلوب'),
    phone: z.string().regex(/^01[0-9]{9}$/, 'رقم الهاتف غير صحيح'),
    address: z.string().default(''),
    governorate: z.string().default(''),
    deliveryMethod: z.enum(['shipping', 'pickup']),
    depositPhotoUrl: z.string().url().optional(),
    items: z.array(orderItemSchema).min(1, 'السلة فارغة'),
    paymentMethod: paymentMethodSchema,
    isCashOnDelivery: z.boolean().default(false),
});
export const addonCategorySchema = z.enum(['ram', 'storage', 'accessory', 'other']);
export const addonInputSchema = z.object({
    name: z.string().min(1, 'الاسم مطلوب'),
    price: z.coerce.number().min(0, 'السعر غير صحيح'),
    description: z.string().default(''),
    category: addonCategorySchema.default('other'),
    compatibleWith: z.array(z.string()).default([]),
    photos: z.array(z.string().url()).default([]),
    stockStatus: stockStatusSchema.default('in_stock'),
    quantity: z.coerce.number().min(0).optional(),
    visible: z.boolean().default(true),
});
export const accessoryInputSchema = z.object({
    name: z.string().min(1, 'الاسم مطلوب'),
    price: z.coerce.number().min(0, 'السعر غير صحيح'),
    description: z.string().default(''),
    category: z.string().default('other'),
    photos: z.array(z.string().url()).default([]),
    stockStatus: stockStatusSchema.default('in_stock'),
    quantity: z.coerce.number().min(0).optional(),
    visible: z.boolean().default(true),
});
export const shippingRatePatchSchema = z.object({
    cost: z.coerce.number().min(0).optional(),
    estimatedDays: z.coerce.number().min(1).optional(),
    active: z.boolean().optional(),
});
export const inventoryAdjustSchema = z.object({
    itemType: z.enum(['laptop', 'addon', 'accessory']),
    itemId: z.string().min(1),
    quantity: z.coerce.number().min(0),
    reason: z.string().min(1, 'سبب التعديل مطلوب'),
    stockStatus: stockStatusSchema.optional(),
});
