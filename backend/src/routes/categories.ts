import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { getCategoryModel, CATEGORY_SLUGS } from '../models/Category.js'
import { requireAdmin } from '../middleware/auth.js'
import { logError, logInfo } from '../lib/logger.js'
import { DatabaseRouter } from '../lib/db-router.js'
import { withIds } from '../lib/json.js'

const router = Router()

const categoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  image: z.string().nullable().optional(),
  order: z.number().optional(),
})

// The 8 fixed homepage categories. These map 1:1 to Product.homeSection, so
// the set itself is not admin-editable — only the display name, order, and
// (most importantly) the real product photo shown on the tile.
const INITIAL_CATEGORIES = [
  { slug: 'laptops', name: 'لابتوبات', image: null, order: 1 },
  { slug: 'bags', name: 'شنط', image: null, order: 2 },
  { slug: 'mice', name: 'ماوسات', image: null, order: 3 },
  { slug: 'ram', name: 'رامات', image: null, order: 4 },
  { slug: 'storage', name: 'هاردات', image: null, order: 5 },
  { slug: 'batteries', name: 'بطاريات', image: null, order: 6 },
  { slug: 'chargers', name: 'شواحن', image: null, order: 7 },
  { slug: 'monitors', name: 'شاشات', image: null, order: 8 },
] as const

// GET /api/categories - Fetch all 8 categories (auto-seeds on first run)
router.get('/api/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    let allCategories = await DatabaseRouter.readAcrossAllDatabases(async connection => {
      const CategoryModel = getCategoryModel(connection)
      return CategoryModel.find().sort({ order: 1 }).lean()
    }, 'categories')

    // Auto-seed any missing categories (covers both a brand-new store and a
    // slug added to CATEGORY_SLUGS after the store already had some seeded).
    const existingSlugs = new Set(allCategories.map(c => c.slug))
    const missing = INITIAL_CATEGORIES.filter(c => !existingSlugs.has(c.slug))

    if (missing.length > 0) {
      try {
        await DatabaseRouter.createWithFailover(async (connection, dbIndex) => {
          const CategoryModel = getCategoryModel(connection)
          for (const c of missing) {
            await new CategoryModel({ ...c, dbIndex }).save()
          }
          return true
        }, 'category')

        allCategories = await DatabaseRouter.readAcrossAllDatabases(async connection => {
          const CategoryModel = getCategoryModel(connection)
          return CategoryModel.find().sort({ order: 1 }).lean()
        }, 'categories')
      } catch {
        // Fall back to in-memory defaults if the write failed for some reason.
        res.json(INITIAL_CATEGORIES.map((c, idx) => ({ ...c, id: `seed-${idx + 1}` })))
        return
      }
    }

    res.json(withIds(allCategories))
  } catch (error) {
    logError('Get categories', error)
    res.json(INITIAL_CATEGORIES.map((c, idx) => ({ ...c, id: `seed-${idx + 1}` })))
  }
})

// PATCH /api/categories/:slug - Update a category's image/name/order (admin only)
router.patch('/api/categories/:slug', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug: rawSlug } = req.params
    if (!CATEGORY_SLUGS.includes(rawSlug as (typeof CATEGORY_SLUGS)[number])) {
      res.status(400).json({ error: 'فئة غير معروفة' })
      return
    }
    const slug = rawSlug as (typeof CATEGORY_SLUGS)[number]

    const data = categoryUpdateSchema.parse(req.body)

    // Find which database (if any) already holds this category, tracking its dbIndex.
    const matches = await DatabaseRouter.readAcrossAllDatabases(async (connection, dbIndex) => {
      const CategoryModel = getCategoryModel(connection)
      const doc = await CategoryModel.findOne({ slug }).lean()
      return doc ? [{ doc, dbIndex }] : []
    }, 'categories')

    let targetDbIndex: number

    if (matches.length > 0) {
      targetDbIndex = matches[0].dbIndex
    } else {
      // Not seeded yet on any database — create it now on whichever database has room.
      const seedDefault = INITIAL_CATEGORIES.find(c => c.slug === slug)
      const { dbIndex } = await DatabaseRouter.createWithFailover(async (connection, dbIndex) => {
        const CategoryModel = getCategoryModel(connection)
        const doc = new CategoryModel({ ...seedDefault, dbIndex })
        await doc.save()
        return doc
      }, 'category')
      targetDbIndex = dbIndex
    }

    const updated = await DatabaseRouter.updateOnDatabase(
      targetDbIndex,
      async connection => getCategoryModel(connection).findOneAndUpdate({ slug }, data, { new: true }).lean(),
      'category'
    )

    logInfo('Update category', `Updated category: ${slug}`)
    res.json(updated ? withIds([updated])[0] : null)
  } catch (error) {
    logError('Update category', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues })
      return
    }
    res.status(500).json({ error: 'حدث خطأ أثناء تعديل الفئة' })
  }
})

export default router
