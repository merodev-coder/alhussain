import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { getAccessoryModel } from '../models/Accessory.js'
import { accessoryInputSchema } from '../lib/validators.js'
import { requireAdmin } from '../middleware/auth.js'
import { logError, logInfo } from '../lib/logger.js'
import { DatabaseRouter } from '../lib/db-router.js'
import { withIds } from '../lib/json.js'
import { suggestStockStatus } from '../lib/stock.js'

const router = Router()

router.get('/api/accessories', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '24' } = req.query
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 24))

    const all = await DatabaseRouter.readAcrossAllDatabases(async connection => {
      const query: Record<string, unknown> = {}
      if (search && typeof search === 'string') {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
        ]
      }
      return getAccessoryModel(connection).find(query).sort({ createdAt: -1 }).lean()
    }, 'accessories')

    const items = withIds(all)
    const total = items.length
    const pages = Math.max(1, Math.ceil(total / limitNum))
    res.json({
      items: items.slice((pageNum - 1) * limitNum, pageNum * limitNum),
      total,
      page: pageNum,
      pages,
    })
  } catch (error) {
    logError('Get accessories', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.get('/api/accessories/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const found = await DatabaseRouter.findByIdAcrossDatabases(
      req.params.id,
      async (connection, id) => getAccessoryModel(connection).findById(id).lean(),
      'accessory'
    )
    if (!found) {
      res.status(404).json({ error: 'الإكسسوار غير موجود' })
      return
    }
    res.json({ ...found.result, id: found.result._id?.toString(), dbIndex: found.dbIndex })
  } catch (error) {
    logError('Get accessory', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.post('/api/accessories', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = accessoryInputSchema.parse(req.body)
    const quantity = data.quantity ?? 0
    const { result } = await DatabaseRouter.createWithFailover(async (connection, dbIndex) => {
      const accessory = new (getAccessoryModel(connection))({
        ...data,
        quantity,
        stockStatus: data.stockStatus ?? suggestStockStatus(quantity),
        dbIndex,
      })
      await accessory.save()
      return accessory
    }, 'accessory')
    logInfo('Create accessory', result.name)
    res.status(201).json(result.toJSON())
  } catch (error) {
    logError('Create accessory', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues })
      return
    }
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.patch('/api/accessories/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = accessoryInputSchema.partial().parse(req.body)
    const found = await DatabaseRouter.findByIdAcrossDatabases(
      req.params.id,
      async (connection, id) => getAccessoryModel(connection).findById(id),
      'accessory'
    )
    if (!found) {
      res.status(404).json({ error: 'الإكسسوار غير موجود' })
      return
    }
    const patch: Record<string, unknown> = { ...data }
    if (data.quantity !== undefined && data.stockStatus === undefined) {
      patch.stockStatus = suggestStockStatus(data.quantity)
    }
    const accessory = await DatabaseRouter.updateOnDatabase(
      found.dbIndex,
      async connection =>
        getAccessoryModel(connection).findByIdAndUpdate(req.params.id, patch, { new: true }),
      'accessory'
    )
    res.json(accessory?.toJSON())
  } catch (error) {
    logError('Update accessory', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues })
      return
    }
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.delete('/api/accessories/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const found = await DatabaseRouter.findByIdAcrossDatabases(
      req.params.id,
      async (connection, id) => getAccessoryModel(connection).findById(id),
      'accessory'
    )
    if (!found) {
      res.status(404).json({ error: 'الإكسسوار غير موجود' })
      return
    }
    await DatabaseRouter.deleteFromDatabase(
      found.dbIndex,
      async connection => getAccessoryModel(connection).findByIdAndDelete(req.params.id),
      'accessory'
    )
    res.json({ success: true })
  } catch (error) {
    logError('Delete accessory', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

export default router
