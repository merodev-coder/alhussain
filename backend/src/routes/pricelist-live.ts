import { Router, Request, Response } from 'express'
import { getProductModel } from '../models/Product.js'
import { logError } from '../lib/logger.js'
import { DatabaseRouter } from '../lib/db-router.js'
import { withIds } from '../lib/json.js'

const router = Router()

/**
 * GET /api/pricelist-live
 *
 * Public, unauthenticated endpoint that builds the price list directly from
 * the real product catalog instead of an uploaded/AI-normalized Excel file.
 *
 * Rules:
 * - Every product with visible === true is included. This store's catalog
 *   is laptops only (there is no separate accessories/category split in the
 *   Product model), so "visible" is exactly the same rule the storefront's
 *   /laptops page uses to decide what a customer can see.
 * - `homeSection` is a different, unrelated field (it only controls which
 *   curated row a product shows in on the homepage, e.g. "best sellers" or
 *   "special offers") and must NOT be used to filter the price list.
 * - Each item carries its primary photo (photos[0]) so the price list can
 *   show a thumbnail and link back to the product page.
 * - Sorted by price ascending so the list reads cheapest -> most expensive.
 */
router.get('/api/pricelist-live', async (_req: Request, res: Response): Promise<void> => {
  try {
    const allProducts = await DatabaseRouter.readAcrossAllDatabases(async connection => {
      const ProductModel = getProductModel(connection)
      return ProductModel.find({ visible: true })
        .sort({ price: 1 })
        .lean()
    }, 'pricelist-live')

    const items = withIds(allProducts)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        photo: p.photos?.[0] || null,
        cpu: p.specs?.cpu || p.cpu || '',
        ram: p.specs?.ram || p.ram || '',
        storage: p.specs?.storage || p.storage || '',
        gpu: p.specs?.gpu || p.gpu || '',
        screen: p.specs?.screen || '',
        stockStatus: p.stockStatus,
      }))
      .sort((a: any, b: any) => (a.price || 0) - (b.price || 0))

    res.json({
      items,
      total: items.length,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    logError('Get live pricelist', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

export default router
