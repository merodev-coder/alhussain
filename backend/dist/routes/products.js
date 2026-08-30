import { Router } from 'express';
import { z } from 'zod';
import Product from '../models/Product.js';
import { productInputSchema } from '../lib/validators.js';
import { requireAdmin } from '../middleware/auth.js';
import { logError, logInfo } from '../lib/logger.js';
const router = Router();
// GET all products or search
router.get('/api/products', async (req, res) => {
    try {
        const { search, page = '1', limit = '24' } = req.query;
        // Parse and validate pagination params
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
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
        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean();
        // Manually set id from _id since lean() bypasses schema transform
        const productsWithId = products.map(p => ({
            ...p,
            id: p._id?.toString(),
        }));
        const totalPages = Math.ceil(total / limitNum);
        res.json({
            items: productsWithId,
            total,
            page: pageNum,
            pages: totalPages,
        });
    }
    catch (error) {
        logError('Get products', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
// GET single product
router.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || id === 'undefined') {
            res.status(400).json({ error: 'معرف المنتج غير صالح' });
            return;
        }
        const product = await Product.findById(id).lean();
        if (!product) {
            res.status(404).json({ error: 'المنتج غير موجود' });
            return;
        }
        // Manually set id from _id since lean() bypasses schema transform
        const productWithId = {
            ...product,
            id: product._id?.toString(),
        };
        res.json(productWithId);
    }
    catch (error) {
        logError('Get product', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
// POST create product
router.post('/api/products', requireAdmin, async (req, res) => {
    try {
        const data = productInputSchema.parse(req.body);
        const product = new Product(data);
        await product.save();
        const productJson = product.toJSON();
        logInfo('Create product', `Created product with ID: ${productJson.id}`);
        res.status(201).json(productJson);
    }
    catch (error) {
        logError('Create product', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues });
            return;
        }
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
// PATCH update product
router.patch('/api/products/:id', requireAdmin, async (req, res) => {
    try {
        logInfo('Update product', `Updating product ID: ${req.params.id}`);
        const data = productInputSchema.partial().parse(req.body);
        const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
        if (!product) {
            logInfo('Update product', `Product not found for ID: ${req.params.id}`);
            res.status(404).json({ error: 'المنتج غير موجود' });
            return;
        }
        logInfo('Update product', `Product updated successfully: ${req.params.id}`);
        res.json(product.toJSON());
    }
    catch (error) {
        logError('Update product', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues });
            return;
        }
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
// DELETE product
router.delete('/api/products/:id', requireAdmin, async (req, res) => {
    try {
        logInfo('Delete product', `Deleting product ID: ${req.params.id}`);
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            logInfo('Delete product', `Product not found for ID: ${req.params.id}`);
            res.status(404).json({ error: 'المنتج غير موجود' });
            return;
        }
        logInfo('Delete product', `Product deleted successfully: ${req.params.id}`);
        res.json({ success: true });
    }
    catch (error) {
        logError('Delete product', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
export default router;
