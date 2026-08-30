import { Router } from 'express';
import { z } from 'zod';
import SpecOption from '../models/SpecOption.js';
import { specOptionInputSchema } from '../lib/validators.js';
import { requireAdmin } from '../middleware/auth.js';
import { logError, logInfo } from '../lib/logger.js';
const router = Router();
// GET all spec options or filter by type
router.get('/api/spec-options', async (req, res) => {
    try {
        const { type } = req.query;
        let query = {};
        if (type && typeof type === 'string') {
            query = { type };
        }
        const options = await SpecOption.find(query).lean();
        res.json(options);
    }
    catch (error) {
        logError('Get spec options', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
// POST create spec option
router.post('/api/spec-options', requireAdmin, async (req, res) => {
    try {
        const data = specOptionInputSchema.parse(req.body);
        const option = new SpecOption(data);
        await option.save();
        logInfo('Create spec option', `Created spec option: ${option.value}`);
        res.status(201).json(option.toJSON());
    }
    catch (error) {
        logError('Create spec option', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues });
            return;
        }
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
// PATCH update spec option
router.patch('/api/spec-options/:id', requireAdmin, async (req, res) => {
    try {
        const data = specOptionInputSchema.partial().parse(req.body);
        const option = await SpecOption.findByIdAndUpdate(req.params.id, data, { new: true });
        if (!option) {
            res.status(404).json({ error: 'الخيار غير موجود' });
            return;
        }
        res.json(option.toJSON());
    }
    catch (error) {
        logError('Update spec option', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues });
            return;
        }
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
// DELETE spec option
router.delete('/api/spec-options/:id', requireAdmin, async (req, res) => {
    try {
        const option = await SpecOption.findByIdAndDelete(req.params.id);
        if (!option) {
            res.status(404).json({ error: 'الخيار غير موجود' });
            return;
        }
        res.json({ success: true });
    }
    catch (error) {
        logError('Delete spec option', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
export default router;
