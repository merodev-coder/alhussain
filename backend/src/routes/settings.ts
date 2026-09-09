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
  vodafoneCashNumber: z.string().min(1, 'Vodafone Cash number is required'),
  instapayNumber: z.string().min(1, 'Instapay number is required'),
  activeUploadThingTokenIndex: z.number().int().min(0).optional(),
  senderEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  senderEmailAppPassword: z.string().optional().or(z.literal('')),
}).transform(data => ({
  ...data,
  vodafoneCashNumber: data.vodafoneCashNumber.trim(),
  instapayNumber: data.instapayNumber.trim(),
  senderEmail: data.senderEmail?.trim() || '',
  senderEmailAppPassword: data.senderEmailAppPassword?.replace(/\s/g, '') || '',
}))

router.get('/api/settings', async (_req: Request, res: Response): Promise<void> => {
  try {
    const connections = getAllConnections()
    let settings = null

    for (const connection of connections) {
      try {
        const SettingsModel = getSiteSettingsModel(connection)
        const found = await SettingsModel.findOne().lean()
        if (found) {
          settings = withId(found)
          break
        }
      } catch (error) {
        logError('Get settings from database', `Failed to query database: ${error}`)
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
    logInfo('Settings Update', `Received request body: ${JSON.stringify(req.body)}`)
    
    const data = settingsSchema.parse(req.body)
    logInfo('Settings Update', `Parsed data: ${JSON.stringify(data)}`)

    // Check if settings already exist across all databases
    const connections = getAllConnections()
    logInfo('Settings Update', `Found ${connections.length} database connections`)
    
    let existing = null
    let targetDbIndex = 0

    for (let i = 0; i < connections.length; i++) {
      try {
        logInfo('Settings Update', `Searching for settings in database ${i}`)
        const SettingsModel = getSiteSettingsModel(connections[i])
        const found = await SettingsModel.findOne().lean()
        if (found) {
          existing = found
          targetDbIndex = i
          logInfo('Settings Update', `Found existing settings in database ${i}`)
          break
        }
      } catch (error) {
        logError('Find settings in database', `Failed to search database ${i}: ${error}`)
      }
    }

    if (existing) {
      logInfo('Settings Update', `Updating existing settings in database ${targetDbIndex}`)
      // Update existing settings using DatabaseRouter
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

      logInfo('Settings Update', `Update data: ${JSON.stringify(updateData)}`)

      const updated = await DatabaseRouter.updateOnDatabase(
        targetDbIndex,
        async (connection) => {
          const SettingsModel = getSiteSettingsModel(connection)
          const result = await SettingsModel.findOneAndUpdate(
            { _id: existing._id },
            updateData,
            { new: true }
          ).lean()
          if (!result) {
            throw new Error('Settings document not found during update')
          }
          logInfo('Settings Update', `Successfully updated settings: ${JSON.stringify(result)}`)
          return result
        },
        'settings'
      )
      res.json(withId(updated))
    } else {
      logInfo('Settings Update', 'Creating new settings on primary database')
      // Create new settings on primary database using DatabaseRouter
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
        logInfo('Settings Update', `Successfully created new settings: ${JSON.stringify(settings.toJSON())}`)
        return settings
      }, 'settings')
      res.status(201).json(result.toJSON())
    }
  } catch (error) {
    logError('Update settings', error)
    if (error instanceof z.ZodError) {
      logError('Settings Validation Error', JSON.stringify(error.issues))
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues })
      return
    }
    logError('Settings Server Error', error instanceof Error ? error.message : String(error))
    res.status(500).json({ error: 'حدث خطأ في الخادم', message: error instanceof Error ? error.message : String(error) })
  }
})

export default router
