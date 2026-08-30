import { Router } from 'express';
import { z } from 'zod';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { orderInputSchema, orderStatusSchema } from '../lib/validators.js';
import { requireAdmin } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import { logError, logInfo } from '../lib/logger.js';
const router = Router();
// Rate limit order creation: 10 per hour per IP
const orderRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: { error: 'محاولات طلب كثيرة جداً، يرجى المحاولة لاحقاً' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Generate unique order number
function generateOrderNumber() {
    return `ORD-${Date.now()}`;
}
// POST create order
router.post('/api/orders', orderRateLimit, async (req, res) => {
    try {
        const data = orderInputSchema.parse(req.body);
        // Validate products and calculate server-side prices
        const validatedItems = [];
        let calculatedTotal = 0;
        for (const item of data.items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                res.status(400).json({ error: `المنتج ${item.name} غير موجود` });
                return;
            }
            if (!product.visible) {
                res.status(400).json({ error: `المنتج ${item.name} غير متاح حالياً` });
                return;
            }
            const serverPrice = product.price;
            const itemTotal = serverPrice * item.qty;
            calculatedTotal += itemTotal;
            validatedItems.push({
                productId: item.productId,
                name: product.name,
                price: serverPrice,
                priceAtOrder: serverPrice, // Snapshot of price at order time
                qty: item.qty,
            });
        }
        // TODO: After Prompt 2 is implemented, also validate and recalculate addon prices here
        const order = new Order({
            customerName: data.customerName,
            phone: data.phone,
            address: data.address,
            governorate: data.governorate,
            deliveryMethod: data.deliveryMethod,
            depositPhotoUrl: data.depositPhotoUrl,
            items: validatedItems,
            total: calculatedTotal, // Use server-calculated total, not client-provided
            orderNumber: generateOrderNumber(),
            status: 'pending',
        });
        await order.save();
        logInfo('Create order', `Order created: ${order.orderNumber}`);
        res.status(201).json(order.toJSON());
    }
    catch (error) {
        logError('Create order', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues });
            return;
        }
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
// GET all orders
router.get('/api/orders', requireAdmin, async (req, res) => {
    try {
        const { status, page = '1', limit = '20' } = req.query;
        // Parse and validate pagination params
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
        let query = {};
        if (status && typeof status === 'string') {
            query = { status };
        }
        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean();
        const totalPages = Math.ceil(total / limitNum);
        res.json({
            items: orders,
            total,
            page: pageNum,
            pages: totalPages,
        });
    }
    catch (error) {
        logError('Get orders', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
// GET single order
router.get('/api/orders/:id', requireAdmin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).lean();
        if (!order) {
            res.status(404).json({ error: 'الطلب غير موجود' });
            return;
        }
        res.json(order);
    }
    catch (error) {
        logError('Get order', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
// PATCH update order status
router.patch('/api/orders/:id', requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        // Validate status
        const statusValidation = orderStatusSchema.safeParse(status);
        if (!statusValidation.success) {
            res.status(400).json({ error: 'حالة الطلب غير صحيحة' });
            return;
        }
        const order = await Order.findByIdAndUpdate(req.params.id, { status: statusValidation.data }, { new: true });
        if (!order) {
            res.status(404).json({ error: 'الطلب غير موجود' });
            return;
        }
        res.json(order.toJSON());
    }
    catch (error) {
        logError('Update order', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
export default router;
