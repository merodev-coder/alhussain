import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { getOrderModel } from '../models/Order.js'
import type { OrderItemDoc } from '../models/Order.js'
import { orderInputSchema, orderStatusSchema, paymentStatusSchema } from '../lib/validators.js'
import { requireAdmin } from '../middleware/auth.js'
import rateLimit from 'express-rate-limit'
import { logError, logInfo } from '../lib/logger.js'
import { DatabaseRouter } from '../lib/db-router.js'
import { withId, withIds } from '../lib/json.js'
import { findAccessoryById, findAddonById, findProductById, findShippingRate } from '../lib/catalog.js'
import { decrementStockForOrder } from '../lib/inventory.js'
import { sendMail } from '../lib/mailer.js'
import { orderConfirmationEmail, orderReceiptEmail } from '../lib/email-templates.js'

const router = Router()

const orderRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'محاولات طلب كثيرة جداً، يرجى المحاولة لاحقاً' },
  standardHeaders: true,
  legacyHeaders: false,
})

function generateOrderNumber(): string {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

router.post('/api/orders', orderRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = orderInputSchema.parse(req.body)

    // Validate cash_on_delivery is only allowed for shipping
    if (data.isCashOnDelivery && data.deliveryMethod === 'pickup') {
      res.status(400).json({ error: 'الدفع عند الاستلام غير متاح لطلبات الاستلام من المتجر' })
      return
    }

    const validatedItems: OrderItemDoc[] = []
    let itemsTotal = 0

    for (const item of data.items) {
      const itemType = item.itemType ?? 'laptop'
      const catalog =
        itemType === 'accessory'
          ? await findAccessoryById(item.productId)
          : await findProductById(item.productId)

      if (!catalog) {
        res.status(400).json({ error: `المنتج ${item.name} غير موجود` })
        return
      }
      if (!catalog.visible) {
        res.status(400).json({ error: `المنتج ${item.name} غير متاح حالياً` })
        return
      }

      const serverPrice = catalog.price
      const selectedAddons = []

      if (itemType === 'accessory' && item.selectedAddons.length > 0) {
        res.status(400).json({ error: 'لا يمكن إضافة ملحقات على الإكسسوارات' })
        return
      }

      for (const addonSel of item.selectedAddons) {
        const addon = await findAddonById(addonSel.addonId)
        if (!addon || !addon.visible) {
          res.status(400).json({ error: 'إحدى الإضافات غير متاحة' })
          return
        }
        const compatible =
          addon.compatibleWith.length === 0 || addon.compatibleWith.includes(item.productId)
        if (!compatible) {
          res.status(400).json({ error: `الإضافة ${addon.name} غير متوافقة مع هذا الجهاز` })
          return
        }
        selectedAddons.push({
          addonId: addon.id,
          name: addon.name,
          price: addon.price,
          qty: addonSel.qty,
        })
        itemsTotal += addon.price * addonSel.qty * item.qty
      }

      itemsTotal += serverPrice * item.qty
      validatedItems.push({
        productId: item.productId,
        itemType,
        name: catalog.name,
        price: serverPrice,
        priceAtOrder: serverPrice,
        qty: item.qty,
        selectedAddons,
      })
    }

    let shippingCost = 0
    if (data.deliveryMethod === 'shipping') {
      if (!data.governorate) {
        res.status(400).json({ error: 'المحافظة مطلوبة للشحن' })
        return
      }
      const rate = await findShippingRate(data.governorate)
      if (!rate) {
        res.status(400).json({ error: 'لا يتوفر الشحن لهذه المحافظة حالياً' })
        return
      }
      shippingCost = rate.cost
    }

    const calculatedTotal = itemsTotal + shippingCost

    // Calculate deposit amount for cash_on_delivery (shipping cost only)
    const depositAmount = data.isCashOnDelivery ? shippingCost : 0

    const { result } = await DatabaseRouter.createWithFailover(async (connection, dbIndex) => {
      const OrderModel = getOrderModel(connection)
      const order = new OrderModel({
        customerName: data.customerName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        governorate: data.governorate,
        deliveryMethod: data.deliveryMethod,
        depositPhotoUrl: data.depositPhotoUrl,
        items: validatedItems,
        shippingCost,
        total: calculatedTotal,
        orderNumber: generateOrderNumber(),
        status: 'pending',
        paymentMethod: data.paymentMethod,
        isCashOnDelivery: data.isCashOnDelivery,
        depositAmount,
        paymentStatus: 'pending_verification',
        stockDecremented: false,
        dbIndex,
      })
      await order.save()
      return order
    }, 'order')

    logInfo('Create order', `Order created: ${result.orderNumber} dbIndex=${result.dbIndex}`)

    // Send order confirmation email
    await sendMail({
      to: data.email,
      ...orderConfirmationEmail(result),
    })

    res.status(201).json(result.toJSON())
  } catch (error) {
    logError('Create order', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues })
      return
    }
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.get('/api/orders', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, paymentStatus, page = '1', limit = '20' } = req.query
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20))

    const all = await DatabaseRouter.readAcrossAllDatabases(async connection => {
      const query: Record<string, unknown> = {}
      if (status && typeof status === 'string') query.status = status
      if (paymentStatus && typeof paymentStatus === 'string') query.paymentStatus = paymentStatus
      return getOrderModel(connection).find(query).sort({ createdAt: -1 }).lean()
    }, 'orders')

    const sorted = withIds(all).sort((a, b) => {
      const da = new Date(a.createdAt as Date).getTime()
      const db = new Date(b.createdAt as Date).getTime()
      return db - da
    })

    const total = sorted.length
    const totalPages = Math.max(1, Math.ceil(total / limitNum))
    const items = sorted.slice((pageNum - 1) * limitNum, pageNum * limitNum)

    res.json({ items, total, page: pageNum, pages: totalPages })
  } catch (error) {
    logError('Get orders', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.get('/api/orders/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const found = await DatabaseRouter.findByIdAcrossDatabases(
      req.params.id,
      async (connection, id) => getOrderModel(connection).findById(id).lean(),
      'order'
    )
    if (!found) {
      res.status(404).json({ error: 'الطلب غير موجود' })
      return
    }
    res.json({ ...withId(found.result), dbIndex: found.dbIndex })
  } catch (error) {
    logError('Get order', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.patch('/api/orders/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body
    const statusValidation = orderStatusSchema.safeParse(status)
    if (!statusValidation.success) {
      res.status(400).json({ error: 'حالة الطلب غير صحيحة' })
      return
    }

    const found = await DatabaseRouter.findByIdAcrossDatabases(
      req.params.id,
      async (connection, id) => getOrderModel(connection).findById(id),
      'order'
    )
    if (!found) {
      res.status(404).json({ error: 'الطلب غير موجود' })
      return
    }

    const current: any = found.result
    const shouldDecrement =
      statusValidation.data === 'shipped' && !current.stockDecremented && current.status !== 'shipped'
    const shouldSendReceipt =
      statusValidation.data === 'completed' && current.status !== 'completed'

    if (shouldDecrement) {
      await decrementStockForOrder(current.toObject())
    }

    const order = await DatabaseRouter.updateOnDatabase(
      found.dbIndex,
      async connection =>
        getOrderModel(connection).findByIdAndUpdate(
          req.params.id,
          {
            status: statusValidation.data,
            ...(shouldDecrement ? { stockDecremented: true } : {}),
          },
          { new: true }
        ),
      'order'
    )

    // Send receipt email when order is completed
    if (shouldSendReceipt && order) {
      await sendMail({
        to: order.email,
        ...orderReceiptEmail(order),
      })
    }

    res.json(order?.toJSON())
  } catch (error) {
    logError('Update order', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.patch(
  '/api/orders/:id/payment',
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = paymentStatusSchema.safeParse(req.body.paymentStatus)
      if (!parsed.success || parsed.data === 'pending_verification') {
        res.status(400).json({ error: 'حالة الدفع غير صحيحة' })
        return
      }

      const found = await DatabaseRouter.findByIdAcrossDatabases(
        req.params.id,
        async (connection, id) => getOrderModel(connection).findById(id),
        'order'
      )
      if (!found || !found.result) {
        res.status(404).json({ error: 'الطلب غير موجود' })
        return
      }

      const current: any = found.result

      const order = await DatabaseRouter.updateOnDatabase(
        found.dbIndex,
        async connection =>
          getOrderModel(connection).findByIdAndUpdate(
            req.params.id,
            {
              paymentStatus: parsed.data,
              ...(parsed.data === 'rejected' && current.status === 'pending' ? { status: 'declined' } : {}),
            },
            { new: true }
          ),
        'order'
      )

      logInfo('Payment review', `Order ${current.orderNumber} paymentStatus=${parsed.data}`)
      res.json(order?.toJSON())
    } catch (error) {
      logError('Update payment status', error)
      res.status(500).json({ error: 'حدث خطأ في الخادم' })
    }
  }
)

export default router
