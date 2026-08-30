import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { getSpecOptionModel } from '../models/SpecOption.js'
import { specOptionInputSchema } from '../lib/validators.js'
import { requireAdmin } from '../middleware/auth.js'
import { logError, logInfo } from '../lib/logger.js'
import { DatabaseRouter } from '../lib/db-router.js'
import { withIds } from '../lib/json.js'

const router = Router()

router.get('/api/spec-options', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query
    const options = await DatabaseRouter.readAcrossAllDatabases(async connection => {
      const query: Record<string, unknown> = {}
      if (type && typeof type === 'string') query.type = type
      return getSpecOptionModel(connection).find(query).lean()
    }, 'specOptions')
    res.json(withIds(options))
  } catch (error) {
    logError('Get spec options', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.post('/api/spec-options', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = specOptionInputSchema.parse(req.body)
    const { result } = await DatabaseRouter.createWithFailover(async (connection, dbIndex) => {
      const option = new (getSpecOptionModel(connection))({ ...data, dbIndex })
      await option.save()
      return option
    }, 'specOption')
    logInfo('Create spec option', `Created spec option: ${result.value}`)
    res.status(201).json(result.toJSON())
  } catch (error) {
    logError('Create spec option', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues })
      return
    }
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.patch('/api/spec-options/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = specOptionInputSchema.partial().parse(req.body)
    const found = await DatabaseRouter.findByIdAcrossDatabases(
      req.params.id,
      async (connection, id) => getSpecOptionModel(connection).findById(id),
      'specOption'
    )
    if (!found) {
      res.status(404).json({ error: 'الخيار غير موجود' })
      return
    }
    const option = await DatabaseRouter.updateOnDatabase(
      found.dbIndex,
      async connection =>
        getSpecOptionModel(connection).findByIdAndUpdate(req.params.id, data, { new: true }),
      'specOption'
    )
    res.json(option?.toJSON())
  } catch (error) {
    logError('Update spec option', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues })
      return
    }
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.delete('/api/spec-options/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const found = await DatabaseRouter.findByIdAcrossDatabases(
      req.params.id,
      async (connection, id) => getSpecOptionModel(connection).findById(id),
      'specOption'
    )
    if (!found) {
      res.status(404).json({ error: 'الخيار غير موجود' })
      return
    }
    await DatabaseRouter.deleteFromDatabase(
      found.dbIndex,
      async connection => getSpecOptionModel(connection).findByIdAndDelete(req.params.id),
      'specOption'
    )
    res.json({ success: true })
  } catch (error) {
    logError('Delete spec option', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

export default router
