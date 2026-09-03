import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { getSiteSettingsModel } from '../models/SiteSettings.js'
import { requireAdmin } from '../middleware/auth.js'
import { logError, logInfo } from '../lib/logger.js'
import { DatabaseRouter } from '../lib/db-router.js'
import { withId } from '../lib/json.js'
import { getAllConnections } from '../lib/db.js'

const router = Router()

const settingsSchema = z.object({
  vodafoneCashNumber: z.string().min(1),
  instapayNumber: z.string().min(1),
  activeUploadThingTokenIndex: z.number().int().min(0).optional(),
  senderEmail: z.string().email().optional().or(z.literal('')),
  senderEmailAppPassword: z.string().optional().or(z.literal('')),
})

router.get('/api/settings', async (_req: Request, res: Response): Promise<void> => {
  try {
    const connections = getAllConnections()
    let settings = null

    for (const connection of connections) {
      const SettingsModel = getSiteSettingsModel(connection)
      const found = await SettingsModel.findOne().lean()
      if (found) {
        settings = withId(found)
        break
      }
    }

    if (!settings) {
      // Return default/empty settings if none exist
      res.json({
        vodafoneCashNumber: '',
        instapayNumber: '',
        activeUploadThingTokenIndex: 0,
        senderEmail: '',
        senderEmailAppPassword: '',
      })
      return
    }

    res.json({
      vodafoneCashNumber: settings.vodafoneCashNumber,
      instapayNumber: settings.instapayNumber,
      activeUploadThingTokenIndex: settings.activeUploadThingTokenIndex ?? 0,
      senderEmail: settings.senderEmail ?? '',
      senderEmailAppPassword: settings.senderEmailAppPassword ?? '',
    })
  } catch (error) {
    logError('Get settings', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.post('/api/settings', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = settingsSchema.parse(req.body)

    // Check if settings already exist across all databases
    const connections = getAllConnections()
    let existing = null
    let targetConnection = null
    let targetDbIndex = 0

    for (let i = 0; i < connections.length; i++) {
      const SettingsModel = getSiteSettingsModel(connections[i])
      const found = await SettingsModel.findOne().lean()
      if (found) {
        existing = found
        targetConnection = connections[i]
        targetDbIndex = i
        break
      }
    }

    if (existing && targetConnection) {
      // Update existing settings
      const SettingsModel = getSiteSettingsModel(targetConnection)
      const updateData: Record<string, unknown> = {
        vodafoneCashNumber: data.vodafoneCashNumber,
        instapayNumber: data.instapayNumber,
      }
      if (data.activeUploadThingTokenIndex !== undefined) {
        updateData.activeUploadThingTokenIndex = data.activeUploadThingTokenIndex
      }
      if (data.senderEmail !== undefined) {
        updateData.senderEmail = data.senderEmail
      }
      if (data.senderEmailAppPassword !== undefined) {
        updateData.senderEmailAppPassword = data.senderEmailAppPassword
      }
      const updated = await SettingsModel.findOneAndUpdate(
        { _id: existing._id },
        updateData,
        { new: true }
      ).lean()
      res.json(withId(updated!))
    } else {
      // Create new settings on primary database
      const primary = connections[0]
      const { result } = await DatabaseRouter.createWithFailover(async (connection, dbIndex) => {
        const SettingsModel = getSiteSettingsModel(connection)
        const settings = new SettingsModel({
          vodafoneCashNumber: data.vodafoneCashNumber,
          instapayNumber: data.instapayNumber,
          activeUploadThingTokenIndex: data.activeUploadThingTokenIndex ?? 0,
          senderEmail: data.senderEmail ?? '',
          senderEmailAppPassword: data.senderEmailAppPassword ?? '',
          dbIndex,
        })
        await settings.save()
        return settings
      }, 'settings')
      res.status(201).json(result.toJSON())
    }
  } catch (error) {
    logError('Update settings', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues })
      return
    }
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

export default router
