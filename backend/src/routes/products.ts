import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { getProductModel } from '../models/Product.js'
import { productInputSchema } from '../lib/validators.js'
import { requireAdmin } from '../middleware/auth.js'
import { logError, logInfo } from '../lib/logger.js'
import { DatabaseRouter } from '../lib/db-router.js'
import { withId, withIds } from '../lib/json.js'
import { suggestStockStatus } from '../lib/stock.js'

const router = Router()

router.get('/api/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '24' } = req.query
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 24))

    const allProducts = await DatabaseRouter.readAcrossAllDatabases(async connection => {
      const ProductModel = getProductModel(connection)
      const query: Record<string, unknown> = {}
      if (search && typeof search === 'string') {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { cpu: { $regex: search, $options: 'i' } },
        ]
      }
      return ProductModel.find(query).sort({ createdAt: -1 }).lean()
    }, 'products')

    const productsWithId = withIds(allProducts)
    const total = productsWithId.length
    const totalPages = Math.max(1, Math.ceil(total / limitNum))
    const startIndex = (pageNum - 1) * limitNum
    const paginatedProducts = productsWithId.slice(startIndex, startIndex + limitNum)

    res.json({
      items: paginatedProducts,
      total,
      page: pageNum,
      pages: totalPages,
    })
  } catch (error) {
    logError('Get products', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.get('/api/products/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    if (!id || id === 'undefined') {
      res.status(400).json({ error: 'معرف المنتج غير صالح' })
      return
    }

    const result = await DatabaseRouter.findByIdAcrossDatabases(
      id,
      async (connection, productId) => getProductModel(connection).findById(productId).lean(),
      'product'
    )

    if (!result) {
      res.status(404).json({ error: 'المنتج غير موجود' })
      return
    }

    res.json({ ...withId(result.result), dbIndex: result.dbIndex })
  } catch (error) {
    logError('Get product', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.post('/api/products', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = productInputSchema.parse(req.body)
    const quantity = data.quantity ?? 0
    const { result } = await DatabaseRouter.createWithFailover(async (connection, dbIndex) => {
      const ProductModel = getProductModel(connection)
      const product = new ProductModel({
        ...data,
        quantity,
        stockStatus: data.stockStatus ?? suggestStockStatus(quantity),
        dbIndex,
      })
      await product.save()
      return product
    }, 'product')
    const productJson = result.toJSON() as { id?: string }
    logInfo('Create product', `Created product with ID: ${productJson.id}`)
    res.status(201).json(productJson)
  } catch (error) {
    logError('Create product', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues })
      return
    }
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.patch('/api/products/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = productInputSchema.partial().parse(req.body)
    const found = await DatabaseRouter.findByIdAcrossDatabases(
      req.params.id,
      async (connection, id) => getProductModel(connection).findById(id),
      'product'
    )
    if (!found) {
      res.status(404).json({ error: 'المنتج غير موجود' })
      return
    }

    const patch: Record<string, unknown> = { ...data }
    if (data.quantity !== undefined && data.stockStatus === undefined) {
      patch.stockStatus = suggestStockStatus(data.quantity)
    }

    const product = await DatabaseRouter.updateOnDatabase(
      found.dbIndex,
      async connection =>
        getProductModel(connection).findByIdAndUpdate(req.params.id, patch, { new: true }),
      'product'
    )
    res.json(product?.toJSON())
  } catch (error) {
    logError('Update product', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues })
      return
    }
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.delete('/api/products/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const found = await DatabaseRouter.findByIdAcrossDatabases(
      req.params.id,
      async (connection, id) => getProductModel(connection).findById(id),
      'product'
    )
    if (!found) {
      res.status(404).json({ error: 'المنتج غير موجود' })
      return
    }
    await DatabaseRouter.deleteFromDatabase(
      found.dbIndex,
      async connection => getProductModel(connection).findByIdAndDelete(req.params.id),
      'product'
    )
    res.json({ success: true })
  } catch (error) {
    logError('Delete product', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

export default router
