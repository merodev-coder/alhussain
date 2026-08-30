import { Router, Request, Response } from 'express'
import multer from 'multer'
import mammoth from 'mammoth'
import { getPricelistModel } from '../models/Pricelist.js'
import { requireAdmin } from '../middleware/auth.js'
import { logError, logInfo } from '../lib/logger.js'
import { DatabaseRouter } from '../lib/db-router.js'
import { withId } from '../lib/json.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const ext = file.mimetype || file.originalname
    if (ext.includes('officedocument.wordprocessingml') || file.originalname?.endsWith('.docx')) {
      cb(null, true)
    } else {
      cb(new Error('يجب أن يكون الملف بصيغة .docx فقط'))
    }
  },
})

router.get('/api/pricelist', async (_req: Request, res: Response): Promise<void> => {
  try {
    const lists = await DatabaseRouter.readAcrossAllDatabases(
      async connection =>
        getPricelistModel(connection).find({ published: true }).sort({ uploadedAt: -1 }).lean(),
      'pricelists'
    )
    const pricelist = lists.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0]
    if (!pricelist) {
      res.status(404).json({ error: 'لا توجد قائمة أسعار منشورة حالياً' })
      return
    }
    res.json(withId(pricelist))
  } catch (error) {
    logError('Get pricelist', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.post(
  '/api/pricelist',
  requireAdmin,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file
      if (!file) {
        res.status(400).json({ error: 'الملف مطلوب' })
        return
      }
      if (!file.originalname?.endsWith('.docx')) {
        res.status(400).json({ error: 'يجب أن يكون الملف بصيغة .docx فقط' })
        return
      }

      const result = await mammoth.convertToHtml({ buffer: file.buffer })
      const parsedHtml = result.value

      await DatabaseRouter.readAcrossAllDatabases(async connection => {
        await getPricelistModel(connection).updateMany({ published: true }, { published: false })
        return []
      }, 'pricelists-unpublish')

      const { result: pricelist } = await DatabaseRouter.createWithFailover(
        async (connection, dbIndex) => {
          const doc = new (getPricelistModel(connection))({
            sourceFileName: file.originalname,
            parsedHtml,
            uploadedAt: new Date(),
            published: true,
            dbIndex,
          })
          await doc.save()
          return doc
        },
        'pricelist'
      )

      logInfo('Publish pricelist', `Published pricelist: ${pricelist.sourceFileName}`)
      res.status(201).json(pricelist.toJSON())
    } catch (error) {
      logError('Publish pricelist', error)
      const message = error instanceof Error ? error.message : 'حدث خطأ في الخادم'
      res.status(500).json({ error: message })
    }
  }
)

export default router
