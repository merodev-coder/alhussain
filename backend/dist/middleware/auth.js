import { getAdminSessionFromRequest } from '../lib/auth.js';
import { logError } from '../lib/logger.js';
export async function requireAdmin(req, res, next) {
    try {
        const session = await getAdminSessionFromRequest(req);
        if (!session) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        req.adminSession = session;
        next();
    }
    catch (error) {
        logError('Auth middleware', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
