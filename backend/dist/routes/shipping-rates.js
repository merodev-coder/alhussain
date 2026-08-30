import { Router } from 'express';
import { z } from 'zod';
import { getShippingRateModel } from '../models/ShippingRate.js';
import { shippingRatePatchSchema } from '../lib/validators.js';
import { requireAdmin } from '../middleware/auth.js';
import { logError } from '../lib/logger.js';
import { DatabaseRouter } from '../lib/db-router.js';
import { withIds } from '../lib/json.js';
const router = Router();
router.get('/api/shipping-rates', async (_req, res) => {
    try {
        const all = await DatabaseRouter.readAcrossAllDatabases(async (connection) => getShippingRateModel(connection).find().sort({ governorate: 1 }).lean(), 'shippingRates');
        const byGov = new Map();
        for (const row of all) {
            if (!byGov.has(row.governorate))
                byGov.set(row.governorate, row);
        }
        res.json(withIds([...byGov.values()]));
    }
    catch (error) {
        logError('Get shipping rates', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
router.patch('/api/shipping-rates/:governorate', requireAdmin, async (req, res) => {
    try {
        const data = shippingRatePatchSchema.parse(req.body);
        const governorate = decodeURIComponent(req.params.governorate);
        const all = await DatabaseRouter.readAcrossAllDatabases(async (connection) => getShippingRateModel(connection).find({ governorate }).lean(), 'shippingRate');
        const existing = all[0];
        if (!existing) {
            res.status(404).json({ error: 'المحافظة غير موجودة' });
            return;
        }
        const dbIndex = existing.dbIndex ?? 0;
        const updated = await DatabaseRouter.updateOnDatabase(dbIndex, async (connection) => getShippingRateModel(connection).findOneAndUpdate({ governorate }, data, { new: true }), 'shippingRate');
        res.json(updated?.toJSON());
    }
    catch (error) {
        logError('Update shipping rate', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues });
            return;
        }
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
export default router;
