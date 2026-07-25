import { Router } from 'express';
import { z } from 'zod';
import Product from '../models/Product.js';
import { productInputSchema } from '../lib/validators.js';
import { requireAdmin } from '../middleware/auth.js';
const router = Router();
// GET all products or search
router.get('/api/products', async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search && typeof search === 'string') {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { cpu: { $regex: search, $options: 'i' } },
                ],
            };
        }
        const products = await Product.find(query).lean();
        res.json(products);
    }
    catch (error) {
        console.error('[v0] Get products error:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
// GET single product
router.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).lean();
        if (!product) {
            res.status(404).json({ error: 'المنتج غير موجود' });
            return;
        }
        res.json(product);
    }
    catch (error) {
        console.error('[v0] Get product error:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
// POST create product (admin only)
router.post('/api/products', requireAdmin, async (req, res) => {
    try {
        const data = productInputSchema.parse(req.body);
        const product = new Product(data);
        await product.save();
        res.status(201).json(product.toJSON());
    }
    catch (error) {
        console.error('[v0] Create product error:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues });
            return;
        }
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
// PATCH update product (admin only)
router.patch('/api/products/:id', requireAdmin, async (req, res) => {
    try {
        const data = productInputSchema.partial().parse(req.body);
        const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
        if (!product) {
            res.status(404).json({ error: 'المنتج غير موجود' });
            return;
        }
        res.json(product.toJSON());
    }
    catch (error) {
        console.error('[v0] Update product error:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues });
            return;
        }
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
// DELETE product (admin only)
router.delete('/api/products/:id', requireAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            res.status(404).json({ error: 'المنتج غير موجود' });
            return;
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('[v0] Delete product error:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
export default router;
