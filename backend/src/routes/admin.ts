import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { signAdminToken, setAdminCookie, clearAdminCookie, getAdminSessionFromRequest } from '../lib/auth.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

router.post('/admin/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = loginSchema.parse(req.body)

    const adminUsername = process.env.ADMIN_USERNAME || 'admin'
    const adminPassword = process.env.ADMIN_PASSWORD || 'password'

    if (body.username !== adminUsername || body.password !== adminPassword) {
      res.status(401).json({ error: 'بيانات الدخول غير صحيحة' })
      return
    }

    const token = await signAdminToken(body.username)
    setAdminCookie(res, token)

    res.json({ success: true, message: 'تم تسجيل الدخول بنجاح' })
  } catch (error) {
    console.error('[v0] Login error:', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة' })
      return
    }
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.post('/admin/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    clearAdminCookie(res)
    res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' })
  } catch (error) {
    console.error('[v0] Logout error:', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.get('/admin/session', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getAdminSessionFromRequest(req)
    if (!session) {
      res.json({ authenticated: false })
      return
    }
    res.json({ authenticated: true, sub: session.sub })
  } catch (error) {
    console.error('[v0] Session check error:', error)
    res.json({ authenticated: false })
  }
})

export default router
