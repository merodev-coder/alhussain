import { Router, Request, Response } from 'express'
import { z } from 'zod'
import Product from '../models/Product.js'
import { productInputSchema } from '../lib/validators.js'

const router = Router()

// GET all products or search
router.get('/api/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query

    let query = {}
    if (search && typeof search === 'string') {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { cpu: { $regex: search, $options: 'i' } },
        ],
      }
    }

    const products = await Product.find(query).lean()
    // Manually set id from _id since lean() bypasses schema transform
    const productsWithId = products.map(p => ({
      ...p,
      id: p._id?.toString(),
    }))
    res.json(productsWithId)
  } catch (error) {
    console.error('[v0] Get products error:', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

// GET single product
router.get('/api/products/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    if (!id || id === 'undefined') {
      res.status(400).json({ error: 'معرف المنتج غير صالح' })
      return
    }
    const product = await Product.findById(id).lean()
    if (!product) {
      res.status(404).json({ error: 'المنتج غير موجود' })
      return
    }
    // Manually set id from _id since lean() bypasses schema transform
    const productWithId = {
      ...product,
      id: product._id?.toString(),
    }
    res.json(productWithId)
  } catch (error) {
    console.error('[v0] Get product error:', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

// POST create product
router.post('/api/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = productInputSchema.parse(req.body)
    const product = new Product(data)
    await product.save()
    const productJson = product.toJSON() as any
    console.log('[v0] Created product with ID:', productJson.id, '_id:', productJson._id)
    res.status(201).json(productJson)
  } catch (error) {
    console.error('[v0] Create product error:', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues })
      return
    }
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

// PATCH update product
router.patch('/api/products/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[v0] PATCH /api/products/:id - ID:', req.params.id, 'Body:', req.body)
    const data = productInputSchema.partial().parse(req.body)
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true })
    if (!product) {
      console.log('[v0] Product not found for ID:', req.params.id)
      res.status(404).json({ error: 'المنتج غير موجود' })
      return
    }
    console.log('[v0] Product updated successfully')
    res.json(product.toJSON())
  } catch (error) {
    console.error('[v0] Update product error:', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues })
      return
    }
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

// DELETE product
router.delete('/api/products/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[v0] DELETE /api/products/:id - ID:', req.params.id)
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) {
      console.log('[v0] Product not found for ID:', req.params.id)
      res.status(404).json({ error: 'المنتج غير موجود' })
      return
    }
    console.log('[v0] Product deleted successfully')
    res.json({ success: true })
  } catch (error) {
    console.error('[v0] Delete product error:', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

export default router
