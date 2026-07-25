import { Router, Request, Response } from 'express'
import multer from 'multer'
import mammoth from 'mammoth'
import Pricelist from '../models/Pricelist.js'

const router = Router()

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    // Only accept .docx files
    const ext = file.mimetype || file.originalname
    if (
      ext.includes('officedocument.wordprocessingml') ||
      file.originalname?.endsWith('.docx')
    ) {
      cb(null, true)
    } else {
      cb(new Error('يجب أن يكون الملف بصيغة .docx فقط'))
    }
  },
})

// GET current published pricelist
router.get('/api/pricelist', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get the most recent published pricelist
    const pricelist = await Pricelist.findOne({ published: true })
      .sort({ uploadedAt: -1 })
      .lean()
    if (!pricelist) {
      res.status(404).json({ error: 'لا توجد قائمة أسعار منشورة حالياً' })
      return
    }
    res.json(pricelist)
  } catch (error) {
    console.error('[v0] Get pricelist error:', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

// POST publish new pricelist (accepts .docx file)
router.post(
  '/api/pricelist',
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

      // Parse .docx file with Mammoth
      const result = await mammoth.convertToHtml({ buffer: file.buffer })
      const parsedHtml = result.value

      // Unpublish any previously published pricelists
      await Pricelist.updateMany({ published: true }, { published: false })

      // Create and save new pricelist
      const pricelist = new Pricelist({
        sourceFileName: file.originalname,
        parsedHtml: parsedHtml,
        uploadedAt: new Date(),
        published: true,
      })

      await pricelist.save()
      res.status(201).json(pricelist.toJSON())
    } catch (error) {
      console.error('[v0] Publish pricelist error:', error)
      const message =
        error instanceof Error ? error.message : 'حدث خطأ في الخادم'
      res.status(500).json({ error: message })
    }
  }
)

export default router
