import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { getAddonModel } from '../models/Addon.js'
import { addonInputSchema } from '../lib/validators.js'
import { requireAdmin } from '../middleware/auth.js'
import { getAdminSessionFromRequest } from '../lib/auth.js'
import { logError, logInfo } from '../lib/logger.js'
import { DatabaseRouter } from '../lib/db-router.js'
import { withIds } from '../lib/json.js'
import { suggestStockStatus } from '../lib/stock.js'

const router = Router()

router.get('/api/addons', async (req: Request, res: Response): Promise<void> => {
  try {
    const { compatibleWith, page = '1', limit = '24' } = req.query
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 24))

    const session = await getAdminSessionFromRequest(req)
    const all = await DatabaseRouter.readAcrossAllDatabases(async connection => {
      const query: Record<string, unknown> = {}
      if (!session) query.visible = true
      return getAddonModel(connection).find(query).sort({ createdAt: -1 }).lean()
    }, 'addons')

    let items = withIds(all)
    if (compatibleWith && typeof compatibleWith === 'string') {
      items = items.filter(
        a => a.compatibleWith.length === 0 || a.compatibleWith.includes(compatibleWith)
      )
    }

    const total = items.length
    const pages = Math.max(1, Math.ceil(total / limitNum))
    res.json({
      items: items.slice((pageNum - 1) * limitNum, pageNum * limitNum),
      total,
      page: pageNum,
      pages,
    })
  } catch (error) {
    logError('Get addons', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.post('/api/addons', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = addonInputSchema.parse(req.body)
    const quantity = data.quantity ?? 0
    const { result } = await DatabaseRouter.createWithFailover(async (connection, dbIndex) => {
      const addon = new (getAddonModel(connection))({
        ...data,
        quantity,
        stockStatus: data.stockStatus ?? suggestStockStatus(quantity),
        dbIndex,
      })
      await addon.save()
      return addon
    }, 'addon')
    logInfo('Create addon', result.name)
    res.status(201).json(result.toJSON())
  } catch (error) {
    logError('Create addon', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues })
      return
    }
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.patch('/api/addons/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = addonInputSchema.partial().parse(req.body)
    const found = await DatabaseRouter.findByIdAcrossDatabases(
      req.params.id,
      async (connection, id) => getAddonModel(connection).findById(id),
      'addon'
    )
    if (!found) {
      res.status(404).json({ error: 'الإضافة غير موجودة' })
      return
    }
    const patch: Record<string, unknown> = { ...data }
    if (data.quantity !== undefined && data.stockStatus === undefined) {
      patch.stockStatus = suggestStockStatus(data.quantity)
    }
    const addon = await DatabaseRouter.updateOnDatabase(
      found.dbIndex,
      async connection =>
        getAddonModel(connection).findByIdAndUpdate(req.params.id, patch, { new: true }),
      'addon'
    )
    res.json(addon?.toJSON())
  } catch (error) {
    logError('Update addon', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues })
      return
    }
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.delete('/api/addons/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const found = await DatabaseRouter.findByIdAcrossDatabases(
      req.params.id,
      async (connection, id) => getAddonModel(connection).findById(id),
      'addon'
    )
    if (!found) {
      res.status(404).json({ error: 'الإضافة غير موجودة' })
      return
    }
    await DatabaseRouter.deleteFromDatabase(
      found.dbIndex,
      async connection => getAddonModel(connection).findByIdAndDelete(req.params.id),
      'addon'
    )
    res.json({ success: true })
  } catch (error) {
    logError('Delete addon', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

export default router
