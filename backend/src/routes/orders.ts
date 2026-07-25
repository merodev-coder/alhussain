import { Router, Request, Response } from 'express'
import { z } from 'zod'
import Order from '../models/Order.js'
import { orderInputSchema, orderStatusSchema } from '../lib/validators.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// Generate unique order number
function generateOrderNumber(): string {
  return `ORD-${Date.now()}`
}

// POST create order
router.post('/api/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = orderInputSchema.parse(req.body)

    const order = new Order({
      ...data,
      orderNumber: generateOrderNumber(),
      status: 'pending',
    })

    await order.save()
    res.status(201).json(order.toJSON())
  } catch (error) {
    console.error('[v0] Create order error:', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.errors })
      return
    }
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

// GET all orders (admin only)
router.get('/api/orders', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query

    let query = {}
    if (status && typeof status === 'string') {
      query = { status }
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean()
    res.json(orders)
  } catch (error) {
    console.error('[v0] Get orders error:', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

// GET single order
router.get('/api/orders/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).lean()
    if (!order) {
      res.status(404).json({ error: 'الطلب غير موجود' })
      return
    }
    res.json(order)
  } catch (error) {
    console.error('[v0] Get order error:', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

// PATCH update order status (admin only)
router.patch('/api/orders/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body

    // Validate status
    const statusValidation = orderStatusSchema.safeParse(status)
    if (!statusValidation.success) {
      res.status(400).json({ error: 'حالة الطلب غير صحيحة' })
      return
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: statusValidation.data },
      { new: true }
    )

    if (!order) {
      res.status(404).json({ error: 'الطلب غير موجود' })
      return
    }

    res.json(order.toJSON())
  } catch (error) {
    console.error('[v0] Update order error:', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

export default router
