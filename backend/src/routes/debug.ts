import { Router, Request, Response } from 'express'
import { requireAdmin } from '../middleware/auth.js'
import { DatabaseRouter } from '../lib/db-router.js'
import { logError, logInfo } from '../lib/logger.js'
import { getUploadThingTokens, getUploadThingTokenCount } from '../lib/uploadthing-tokens.js'

const router = Router()

// Apply requireAdmin to all debug routes
router.use(requireAdmin)

// Debug endpoint to check database status
router.get('/db-status', async (_req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await DatabaseRouter.getDatabaseStatus()
    const currentRoundRobinIndex = DatabaseRouter.getCurrentRoundRobinIndex()
    logInfo('Debug DB status', `Database status check: ${dbStatus.length} database(s), current round-robin index: ${currentRoundRobinIndex}`)
    res.json({
      totalDatabases: dbStatus.length,
      currentRoundRobinIndex,
      databases: dbStatus,
    })
  } catch (error) {
    logError('Debug DB status', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

// Debug endpoint to check UploadThing token configuration
router.get('/uploadthing-status', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Note: UploadThing uses a single server-side token (UPLOADTHING_TOKEN)
    // Multi-token round-robin distribution would require a more complex architectural approach
    // since UploadThing creates a single instance per file router.
    logInfo('Debug UploadThing status', 'UploadThing token configuration check')

    res.json({
      note: 'UploadThing uses a single server-side token (UPLOADTHING_TOKEN).',
      configuration: {
        envVariable: 'UPLOADTHING_TOKEN (server-side only, not exposed to browser)',
        location: 'Next.js environment variables (frontend/.env.local)',
        distribution: 'Single token (multi-token round-robin not implemented due to UploadThing API limitations)',
        security: 'Server-side only (not exposed to browser)',
      },
      recommendation: 'Check the Next.js .env.local and Vercel environment variables for UPLOADTHING_TOKEN.',
    })
  } catch (error) {
    logError('Debug UploadThing status', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

export default router
