import { Router } from 'express';
import { z } from 'zod';
import { signAdminToken, setAdminCookie, clearAdminCookie, getAdminSessionFromRequest } from '../lib/auth.js';
import rateLimit from 'express-rate-limit';
import { logError, logInfo, logWarn } from '../lib/logger.js';
const router = Router();
// Rate limit login attempts: 5 per 15 minutes per IP
const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { error: 'محاولات تسجيل دخول كثيرة جداً، يرجى المحاولة لاحقاً' },
    standardHeaders: true,
    legacyHeaders: false,
});
const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});
router.post('/admin/login', loginRateLimit, async (req, res) => {
    try {
        const body = loginSchema.parse(req.body);
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;
        // For testing: use fallback credentials if env vars not set
        if (!adminUsername || !adminPassword) {
            logWarn('Admin login', 'ADMIN_USERNAME or ADMIN_PASSWORD missing - using fallback for testing');
            const fallbackUsername = 'admin';
            const fallbackPassword = 'admin123';
            if (body.username !== fallbackUsername || body.password !== fallbackPassword) {
                res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
                return;
            }
            const token = await signAdminToken(fallbackUsername);
            await setAdminCookie(res, token);
            logInfo('Admin login', `User logged in: ${fallbackUsername} (fallback)`);
            res.json({ success: true, message: 'تم تسجيل الدخول بنجاح' });
            return;
        }
        if (body.username !== adminUsername || body.password !== adminPassword) {
            res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
            return;
        }
        const token = await signAdminToken(body.username);
        await setAdminCookie(res, token);
        logInfo('Admin login', `User logged in: ${body.username}`);
        res.json({ success: true, message: 'تم تسجيل الدخول بنجاح' });
    }
    catch (error) {
        logError('Admin login', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'بيانات غير صحيحة' });
            return;
        }
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
router.post('/admin/logout', async (req, res) => {
    try {
        await clearAdminCookie(res);
        logInfo('Admin logout', 'User logged out');
        res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
    }
    catch (error) {
        logError('Admin logout', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
router.get('/admin/session', async (req, res) => {
    try {
        const session = await getAdminSessionFromRequest(req);
        if (session) {
            res.json({ authenticated: true, sub: session.sub });
        }
        else {
            res.json({ authenticated: false });
        }
    }
    catch (error) {
        logError('Admin session check', error);
        res.json({ authenticated: false });
    }
});
export default router;
