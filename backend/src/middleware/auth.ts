import { Request, Response, NextFunction } from 'express'
import { getAdminSessionFromRequest } from '../lib/auth.js'
import { logError } from '../lib/logger.js'

declare global {
  namespace Express {
    interface Request {
      adminSession?: { sub: string; role: 'admin' }
    }
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await getAdminSessionFromRequest(req)
    if (!session) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    req.adminSession = session
    next()
  } catch (error) {
    logError('Auth middleware', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
