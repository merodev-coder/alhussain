import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { requireAdmin } from '../middleware/auth.js';
const router = Router();
// GET dashboard stats (admin only)
router.get('/api/dashboard-stats', requireAdmin, async (req, res) => {
    try {
        // Get all orders
        const allOrders = await Order.find().lean();
        // Calculate stats
        const totalOrders = allOrders.length;
        const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const ordersByStatus = {
            pending: allOrders.filter((o) => o.status === 'pending').length,
            confirmed: allOrders.filter((o) => o.status === 'confirmed').length,
            declined: allOrders.filter((o) => o.status === 'declined').length,
            shipped: allOrders.filter((o) => o.status === 'shipped').length,
            completed: allOrders.filter((o) => o.status === 'completed').length,
        };
        // Get recent orders
        const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).lean();
        // Get total products
        const totalProducts = await Product.countDocuments();
        res.json({
            totalOrders,
            totalRevenue,
            ordersByStatus,
            recentOrders,
            totalProducts,
        });
    }
    catch (error) {
        console.error('[v0] Dashboard stats error:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
export default router;
