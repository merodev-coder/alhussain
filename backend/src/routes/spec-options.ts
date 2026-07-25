import { Router, Request, Response } from 'express'
import { z } from 'zod'
import SpecOption from '../models/SpecOption.js'
import { specOptionInputSchema } from '../lib/validators.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// GET all spec options or filter by type
router.get('/api/spec-options', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query

    let query = {}
    if (type && typeof type === 'string') {
      query = { type }
    }

    const options = await SpecOption.find(query).lean()
    res.json(options)
  } catch (error) {
    console.error('[v0] Get spec options error:', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

// POST create spec option (admin only)
router.post('/api/spec-options', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = specOptionInputSchema.parse(req.body)
    const option = new SpecOption(data)
    await option.save()
    res.status(201).json(option.toJSON())
  } catch (error) {
    console.error('[v0] Create spec option error:', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.errors })
      return
    }
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

// PATCH update spec option (admin only)
router.patch('/api/spec-options/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = specOptionInputSchema.partial().parse(req.body)
    const option = await SpecOption.findByIdAndUpdate(req.params.id, data, { new: true })
    if (!option) {
      res.status(404).json({ error: 'الخيار غير موجود' })
      return
    }
    res.json(option.toJSON())
  } catch (error) {
    console.error('[v0] Update spec option error:', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.errors })
      return
    }
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

// DELETE spec option (admin only)
router.delete('/api/spec-options/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const option = await SpecOption.findByIdAndDelete(req.params.id)
    if (!option) {
      res.status(404).json({ error: 'الخيار غير موجود' })
      return
    }
    res.json({ success: true })
  } catch (error) {
    console.error('[v0] Delete spec option error:', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

export default router
