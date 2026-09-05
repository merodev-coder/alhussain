import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { getHeroSlideModel } from '../models/HeroSlide.js'
import { requireAdmin } from '../middleware/auth.js'
import { logError, logInfo } from '../lib/logger.js'
import { DatabaseRouter } from '../lib/db-router.js'
import { withId, withIds } from '../lib/json.js'

const router = Router()

const heroSlideSchema = z.object({
  headline: z.string().min(1, 'العنوان الرئيسي مطلوب'),
  subtitle: z.string().default(''),
  buttonText: z.string().default('تصفح الآن'),
  buttonColor: z.string().default('#2563eb'),
  buttonLink: z.string().default('/laptops'),
  badgeImage: z.string().nullable().optional(),
  images: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  order: z.number().default(0),
})

// Default slides to seed if DB is empty
const INITIAL_HERO_SLIDES = [
  {
    headline: 'أقوى أجهزة اللاب توب الاستيراد في مصر',
    subtitle:
      'نخبة من أجهزة اللابتوب للأعمال، الجرافيك والألعاب بضمان حقيقي واختبار شامل لجميع القطع قبل الاستلام.',
    buttonText: 'تصفح أقوى العروض',
    buttonColor: '#2563eb',
    buttonLink: '/laptops',
    badgeImage: null,
    images: [
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1400&q=80',
    ],
    isActive: true,
    order: 1,
  },
  {
    headline: 'لابتوبات الوركستيشن والجرافيك الاحترافي',
    subtitle:
      'معالجات Core i7/i9 وكروت شاشة RTX مخصصة للمصممين والمهندسين وأعمال الرندر الشاقة بأفضل سعر.',
    buttonText: 'أجهزة الجرافيك والرندر',
    buttonColor: '#2563eb',
    buttonLink: '/laptops?section=graphics',
    badgeImage: null,
    images: [
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1400&q=80',
    ],
    isActive: true,
    order: 2,
  },
  {
    headline: 'سلسلة لابتوبات البيزنس والألترا بوك',
    subtitle:
      'أجهزة ThinkPad وDell Latitude وHP EliteBook بخفة استثنائية، بطاريات تدوم طويلاً، واعتمادية عسكرية.',
    buttonText: 'أجهزة البيزنس والشركات',
    buttonColor: '#2563eb',
    buttonLink: '/laptops?section=business',
    badgeImage: null,
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1400&q=80',
    ],
    isActive: true,
    order: 3,
  },
]

// GET /api/hero-slides - Fetch slides
router.get('/api/hero-slides', async (req: Request, res: Response): Promise<void> => {
  try {
    let allSlides = await DatabaseRouter.readAcrossAllDatabases(async connection => {
      const HeroModel = getHeroSlideModel(connection)
      return HeroModel.find().sort({ order: 1, createdAt: -1 }).lean()
    }, 'heroSlides')

    // Auto-seed if database is empty
    if (!allSlides || allSlides.length === 0) {
      try {
        await DatabaseRouter.createWithFailover(async (connection, dbIndex) => {
          const HeroModel = getHeroSlideModel(connection)
          for (const s of INITIAL_HERO_SLIDES) {
            await new HeroModel({ ...s, dbIndex }).save()
          }
          return true
        }, 'heroSlide')

        allSlides = await DatabaseRouter.readAcrossAllDatabases(async connection => {
          const HeroModel = getHeroSlideModel(connection)
          return HeroModel.find().sort({ order: 1 }).lean()
        }, 'heroSlides')
      } catch {
        // Return fallback objects if database write fails
        res.json(INITIAL_HERO_SLIDES.map((s, idx) => ({ ...s, id: `seed-${idx + 1}` })))
        return
      }
    }

    res.json(withIds(allSlides))
  } catch (error) {
    logError('Get hero slides', error)
    res.json(INITIAL_HERO_SLIDES.map((s, idx) => ({ ...s, id: `seed-${idx + 1}` })))
  }
})

// POST /api/hero-slides - Create a new slide (admin only)
router.post('/api/hero-slides', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = heroSlideSchema.parse(req.body)

    const { result } = await DatabaseRouter.createWithFailover(async (connection, dbIndex) => {
      const HeroModel = getHeroSlideModel(connection)
      const count = await HeroModel.countDocuments()
      const slide = new HeroModel({
        ...data,
        order: data.order ?? count + 1,
        dbIndex,
      })
      await slide.save()
      return slide
    }, 'heroSlide')

    const slideJson = result.toJSON() as { id?: string }
    logInfo('Create hero slide', `Created slide with ID: ${slideJson.id}`)
    res.status(201).json(slideJson)
  } catch (error) {
    logError('Create hero slide', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues })
      return
    }
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة الشريحة' })
  }
})

// PUT /api/hero-slides/reorder - Reorder slides (admin only)
router.put('/api/hero-slides/reorder', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body as { ids: string[] }
    if (!Array.isArray(ids)) {
      res.status(400).json({ error: 'قائمة المعرفات غير صحيحة' })
      return
    }

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      const found = await DatabaseRouter.findByIdAcrossDatabases(
        id,
        async (connection, slideId) => getHeroSlideModel(connection).findById(slideId),
        'heroSlide'
      )
      if (found) {
        await DatabaseRouter.updateOnDatabase(
          found.dbIndex,
          async connection =>
            getHeroSlideModel(connection).findByIdAndUpdate(id, { order: i + 1 }),
          'heroSlide'
        )
      }
    }

    res.json({ success: true, message: 'تم تحديث ترتيب الشرائح بنجاح' })
  } catch (error) {
    logError('Reorder hero slides', error)
    res.status(500).json({ error: 'حدث خطأ في إعادة الترتيب' })
  }
})

// PATCH /api/hero-slides/:id - Update a slide (admin only)
router.patch('/api/hero-slides/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = heroSlideSchema.partial().parse(req.body)
    const { id } = req.params

    const found = await DatabaseRouter.findByIdAcrossDatabases(
      id,
      async (connection, slideId) => getHeroSlideModel(connection).findById(slideId),
      'heroSlide'
    )

    if (!found) {
      res.status(404).json({ error: 'الشريحة غير موجودة' })
      return
    }

    const updated = await DatabaseRouter.updateOnDatabase(
      found.dbIndex,
      async connection =>
        getHeroSlideModel(connection).findByIdAndUpdate(id, data, { new: true }),
      'heroSlide'
    )

    res.json(updated?.toJSON())
  } catch (error) {
    logError('Update hero slide', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues })
      return
    }
    res.status(500).json({ error: 'حدث خطأ أثناء تعديل الشريحة' })
  }
})

// DELETE /api/hero-slides/:id - Delete a slide (admin only)
router.delete('/api/hero-slides/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const found = await DatabaseRouter.findByIdAcrossDatabases(
      id,
      async (connection, slideId) => getHeroSlideModel(connection).findById(slideId),
      'heroSlide'
    )

    if (!found) {
      res.status(404).json({ error: 'الشريحة غير موجودة' })
      return
    }

    await DatabaseRouter.updateOnDatabase(
      found.dbIndex,
      async connection => getHeroSlideModel(connection).findByIdAndDelete(id),
      'heroSlide'
    )

    res.json({ success: true, message: 'تم حذف الشريحة' })
  } catch (error) {
    logError('Delete hero slide', error)
    res.status(500).json({ error: 'حدث خطأ أثناء حذف الشريحة' })
  }
})

export default router
