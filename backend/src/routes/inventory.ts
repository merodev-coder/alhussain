import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { getProductModel } from '../models/Product.js'
import { getAddonModel } from '../models/Addon.js'
import { getAccessoryModel } from '../models/Accessory.js'
import { getInventoryLogModel } from '../models/InventoryLog.js'
import { inventoryAdjustSchema } from '../lib/validators.js'
import { requireAdmin } from '../middleware/auth.js'
import { logError } from '../lib/logger.js'
import { DatabaseRouter } from '../lib/db-router.js'
import { withIds } from '../lib/json.js'
import { suggestStockStatus } from '../lib/stock.js'
import { findAccessoryById, findAddonById, findProductById } from '../lib/catalog.js'

const router = Router()

type Row = {
  id: string
  name: string
  category: 'laptop' | 'addon' | 'accessory'
  subcategory?: string
  stockStatus: string
  quantity: number
  dbIndex: number
}

router.get('/api/inventory', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, lowStock } = req.query

    const [products, addons, accessories] = await Promise.all([
      DatabaseRouter.readAcrossAllDatabases(
        async connection => getProductModel(connection).find().lean(),
        'products'
      ),
      DatabaseRouter.readAcrossAllDatabases(
        async connection => getAddonModel(connection).find().lean(),
        'addons'
      ),
      DatabaseRouter.readAcrossAllDatabases(
        async connection => getAccessoryModel(connection).find().lean(),
        'accessories'
      ),
    ])

    let rows: Row[] = [
      ...withIds(products).map(p => ({
        id: p.id,
        name: p.name,
        category: 'laptop' as const,
        subcategory: 'لابتوب',
        stockStatus: p.stockStatus,
        quantity: p.quantity ?? 0,
        dbIndex: p.dbIndex ?? 0,
      })),
      ...withIds(addons).map(a => ({
        id: a.id,
        name: a.name,
        category: 'addon' as const,
        subcategory: a.category,
        stockStatus: a.stockStatus,
        quantity: a.quantity ?? 0,
        dbIndex: a.dbIndex ?? 0,
      })),
      ...withIds(accessories).map(a => ({
        id: a.id,
        name: a.name,
        category: 'accessory' as const,
        subcategory: a.category,
        stockStatus: a.stockStatus,
        quantity: a.quantity ?? 0,
        dbIndex: a.dbIndex ?? 0,
      })),
    ]

    if (category && typeof category === 'string' && category !== 'all') {
      rows = rows.filter(r => r.category === category)
    }
    if (lowStock === '1' || lowStock === 'true') {
      rows = rows.filter(r => r.quantity <= 3)
    }

    res.json(rows)
  } catch (error) {
    logError('Get inventory', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.get('/api/inventory/logs', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const logs = await DatabaseRouter.readAcrossAllDatabases(
      async connection => getInventoryLogModel(connection).find().sort({ date: -1 }).limit(200).lean(),
      'inventoryLogs'
    )
    res.json(withIds(logs).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
  } catch (error) {
    logError('Get inventory logs', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.get('/api/inventory/export.csv', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [products, addons, accessories] = await Promise.all([
      DatabaseRouter.readAcrossAllDatabases(
        async connection => getProductModel(connection).find().lean(),
        'products'
      ),
      DatabaseRouter.readAcrossAllDatabases(
        async connection => getAddonModel(connection).find().lean(),
        'addons'
      ),
      DatabaseRouter.readAcrossAllDatabases(
        async connection => getAccessoryModel(connection).find().lean(),
        'accessories'
      ),
    ])

    const lines = ['name,category,quantity,stockStatus']
    for (const p of withIds(products)) {
      lines.push(`"${p.name.replace(/"/g, '""')}",laptop,${p.quantity ?? 0},${p.stockStatus}`)
    }
    for (const a of withIds(addons)) {
      lines.push(`"${a.name.replace(/"/g, '""')}",addon,${a.quantity ?? 0},${a.stockStatus}`)
    }
    for (const a of withIds(accessories)) {
      lines.push(`"${a.name.replace(/"/g, '""')}",accessory,${a.quantity ?? 0},${a.stockStatus}`)
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="inventory.csv"')
    res.send('\uFEFF' + lines.join('\n'))
  } catch (error) {
    logError('Export inventory', error)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

router.patch('/api/inventory', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = inventoryAdjustSchema.parse(req.body)
    const adminUser = req.adminSession?.sub

    if (!adminUser) {
      logError('Adjust inventory', 'Admin session missing user identifier')
      res.status(401).json({ error: 'جلسة المسؤول غير صالحة' })
      return
    }

    const lookup =
      data.itemType === 'laptop'
        ? await findProductById(data.itemId)
        : data.itemType === 'addon'
          ? await findAddonById(data.itemId)
          : await findAccessoryById(data.itemId)

    if (!lookup) {
      res.status(404).json({ error: 'العنصر غير موجود' })
      return
    }

    const oldQty = lookup.quantity ?? 0
    const stockStatus = data.stockStatus ?? suggestStockStatus(data.quantity)

    if (data.itemType === 'laptop') {
      await DatabaseRouter.updateOnDatabase(
        lookup.dbIndex,
        async connection =>
          getProductModel(connection).findByIdAndUpdate(data.itemId, {
            quantity: data.quantity,
            stockStatus,
          }),
        'product'
      )
    } else if (data.itemType === 'addon') {
      await DatabaseRouter.updateOnDatabase(
        lookup.dbIndex,
        async connection =>
          getAddonModel(connection).findByIdAndUpdate(data.itemId, {
            quantity: data.quantity,
            stockStatus,
          }),
        'addon'
      )
    } else {
      await DatabaseRouter.updateOnDatabase(
        lookup.dbIndex,
        async connection =>
          getAccessoryModel(connection).findByIdAndUpdate(data.itemId, {
            quantity: data.quantity,
            stockStatus,
          }),
        'accessory'
      )
    }

    await DatabaseRouter.createWithFailover(async (connection, dbIndex) => {
      const log = new (getInventoryLogModel(connection))({
        itemType: data.itemType,
        itemId: data.itemId,
        itemName: lookup.name,
        adminUser,
        oldQty,
        newQty: data.quantity,
        reason: data.reason,
        date: new Date(),
        dbIndex,
      })
      await log.save()
      return log
    }, 'inventoryLog')

    res.json({ success: true, quantity: data.quantity, stockStatus })
  } catch (error) {
    logError('Adjust inventory', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'بيانات غير صحيحة', details: error.issues })
      return
    }
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

export default router
