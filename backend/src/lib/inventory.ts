/**
 * Inventory decrement after payment confirmation.
 *
 * Sequential updates (NOT a multi-document MongoDB transaction):
 * catalog items (and even a single order's lines) can live on different Atlas
 * clusters after failover. MongoDB sessions cannot span two clusters.
 * Each decrement is logged; a failure on one line does not roll back earlier lines.
 * Orders store `stockDecremented` so a second Confirm click does not subtract twice.
 */
import type { OrderDoc } from '../models/Order.js'
import { getProductModel } from '../models/Product.js'
import { getAddonModel } from '../models/Addon.js'
import { getAccessoryModel } from '../models/Accessory.js'
import { DatabaseRouter } from './db-router.js'
import { suggestStockStatus } from './stock.js'
import { logError, logInfo, logWarn } from './logger.js'
import { findAccessoryById, findAddonById, findProductById } from './catalog.js'

async function decrementById(
  kind: 'laptop' | 'addon' | 'accessory',
  id: string,
  amount: number
): Promise<void> {
  if (amount <= 0) return

  if (kind === 'laptop') {
    const item = await findProductById(id)
    if (!item) {
      logWarn('Inventory', `Product ${id} not found while decrementing`)
      return
    }
    const nextQty = Math.max(0, (item.quantity ?? 0) - amount)
    await DatabaseRouter.updateOnDatabase(
      item.dbIndex,
      async connection =>
        getProductModel(connection).findByIdAndUpdate(id, {
          quantity: nextQty,
          stockStatus: suggestStockStatus(nextQty),
        }),
      'product'
    )
    logInfo('Inventory', `Product ${id} quantity ${item.quantity} → ${nextQty}`)
    return
  }

  if (kind === 'addon') {
    const item = await findAddonById(id)
    if (!item) {
      logWarn('Inventory', `Addon ${id} not found while decrementing`)
      return
    }
    const nextQty = Math.max(0, (item.quantity ?? 0) - amount)
    await DatabaseRouter.updateOnDatabase(
      item.dbIndex,
      async connection =>
        getAddonModel(connection).findByIdAndUpdate(id, {
          quantity: nextQty,
          stockStatus: suggestStockStatus(nextQty),
        }),
      'addon'
    )
    logInfo('Inventory', `Addon ${id} quantity ${item.quantity} → ${nextQty}`)
    return
  }

  const item = await findAccessoryById(id)
  if (!item) {
    logWarn('Inventory', `Accessory ${id} not found while decrementing`)
    return
  }
  const nextQty = Math.max(0, (item.quantity ?? 0) - amount)
  await DatabaseRouter.updateOnDatabase(
    item.dbIndex,
    async connection =>
      getAccessoryModel(connection).findByIdAndUpdate(id, {
        quantity: nextQty,
        stockStatus: suggestStockStatus(nextQty),
      }),
    'accessory'
  )
  logInfo('Inventory', `Accessory ${id} quantity ${item.quantity} → ${nextQty}`)
}

export async function decrementStockForOrder(order: OrderDoc): Promise<void> {
  for (const line of order.items) {
    try {
      const kind = line.itemType === 'accessory' ? 'accessory' : 'laptop'
      await decrementById(kind, line.productId, line.qty)
      for (const addon of line.selectedAddons || []) {
        await decrementById('addon', addon.addonId, addon.qty * line.qty)
      }
    } catch (error) {
      logError(
        'Inventory',
        `Failed decrementing line ${line.productId} on order ${order.orderNumber}: ${error}`
      )
    }
  }
}
