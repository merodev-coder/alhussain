import { Router } from 'express';
import { z } from 'zod';
import { signAdminToken, setAdminCookie, clearAdminCookie, getAdminSessionFromRequest } from '../lib/auth.js';
import rateLimit from 'express-rate-limit';
const router = Router();
const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'محاولات دخول كثيرة جداً، يرجى المحاولة لاحقاً',
});
router.post('/admin/login', loginLimiter, async (req, res) => {
    try {
        const body = loginSchema.parse(req.body);
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'password';
        if (body.username !== adminUsername || body.password !== adminPassword) {
            res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
            return;
        }
        const token = await signAdminToken(body.username);
        setAdminCookie(res, token);
        res.json({ success: true, message: 'تم تسجيل الدخول بنجاح' });
    }
    catch (error) {
        console.error('[v0] Login error:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'بيانات غير صحيحة' });
            return;
        }
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
router.post('/admin/logout', async (req, res) => {
    try {
        clearAdminCookie(res);
        res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
    }
    catch (error) {
        console.error('[v0] Logout error:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
router.get('/admin/session', async (req, res) => {
    try {
        const session = await getAdminSessionFromRequest(req);
        if (!session) {
            res.json({ authenticated: false });
            return;
        }
        res.json({ authenticated: true, sub: session.sub });
    }
    catch (error) {
        console.error('[v0] Session check error:', error);
        res.json({ authenticated: false });
    }
});
export default router;
