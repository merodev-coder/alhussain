import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { DatabaseRouter } from '../lib/db-router.js';
import { logError, logInfo } from '../lib/logger.js';
import { getUploadThingTokens, getUploadThingTokenCount } from '../lib/uploadthing-tokens.js';
const router = Router();
// Apply requireAdmin to all debug routes
router.use(requireAdmin);
// Debug endpoint to check database status
router.get('/db-status', async (_req, res) => {
    try {
        const dbStatus = await DatabaseRouter.getDatabaseStatus();
        logInfo('Debug DB status', `Database status check: ${dbStatus.length} database(s)`);
        res.json({
            totalDatabases: dbStatus.length,
            strategy: 'sequential-fill (dbIndex 0 first, then 1, 2, etc. on storage-quota errors)',
            databases: dbStatus,
        });
    }
    catch (error) {
        logError('Debug DB status', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
// Debug endpoint to check UploadThing token configuration
router.get('/uploadthing-status', async (_req, res) => {
    try {
        const tokens = getUploadThingTokens();
        const tokenCount = getUploadThingTokenCount();
        logInfo('Debug UploadThing status', `UploadThing token configuration check: ${tokenCount} token(s)`);
        res.json({
            totalTokens: tokenCount,
            strategy: 'static - token bound at module load time',
            constraint: 'UploadThing SDK architecture does NOT support per-request token swapping. The uploader instance created by createUploadthing() is permanently bound to the token passed at module initialization. Middleware functions run per-request but cannot modify the underlying uploader instance or token.',
            technicalDetails: {
                reason: 'The token is resolved from config when the Effect runtime is created in createRouteHandler(), which happens once at module load time. Middleware can only return metadata, not change runtime configuration.',
                evidence: 'See UploadThing GitHub issue #1162 (open feature request for multi-token support) and source code in packages/uploadthing/src/_internal/config.ts and handler.ts',
            },
            configuration: {
                envVariable: 'UPLOADTHING_TOKEN (primary), UPLOADTHING_TOKEN_2, UPLOADTHING_TOKEN_3, etc.',
                location: 'Backend environment variables (backend/.env)',
                currentUsage: 'Only UPLOADTHING_TOKEN is actively used. Additional tokens are informational only.',
                security: 'Server-side only (not exposed to browser)',
            },
            adminSettings: {
                activeUploadThingTokenIndex: 'Informational field for admin tracking only. Does NOT affect which token is used for uploads.',
                requiredAction: 'To change the active UploadThing token, update UPLOADTHING_TOKEN in backend/.env and restart the Express server.',
            },
            recommendation: 'Monitor UploadThing quota usage. When approaching limits, manually update UPLOADTHING_TOKEN environment variable and redeploy. The activeUploadThingTokenIndex field in admin settings can be used to track which token is currently active for your own documentation.',
        });
    }
    catch (error) {
        logError('Debug UploadThing status', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});
export default router;
