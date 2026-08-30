import { Router } from 'express';
import { getOrderModel } from '../models/Order.js';
import { getProductModel } from '../models/Product.js';
import { requireAdmin } from '../middleware/auth.js';
import { logError } from '../lib/logger.js';
import { DatabaseRouter } from '../lib/db-router.js';
import { withId, withIds } from '../lib/json.js';
const router = Router();
router.get('/api/dashboard-stats', requireAdmin, async (_req, res) => {
    try {
        const allOrders = withIds(await DatabaseRouter.readAcrossAllDatabases(async (connection) => getOrderModel(connection).find().lean(), 'orders'));
        const totalOrders = allOrders.length;
        const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const ordersByStatus = {
            pending: allOrders.filter(o => o.status === 'pending').length,
            confirmed: allOrders.filter(o => o.status === 'confirmed').length,
            declined: allOrders.filter(o => o.status === 'declined').length,
            shipped: allOrders.filter(o => o.status === 'shipped').length,
            completed: allOrders.filter(o => o.status === 'completed').length,
        };
        const recentOrders = [...allOrders]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map(withId);
        const allProducts = await DatabaseRouter.readAcrossAllDatabases(async (connection) => getProductModel(connection).find().lean(), 'products');
        res.json({
            totalOrders,
            totalRevenue,
            ordersByStatus,
            recentOrders,
            totalProducts: allProducts.length,
        });
    }
    catch (error) {
        logError('Dashboard stats', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
export default router;
