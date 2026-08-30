import type { StockStatus } from '../models/Product.js'

/** Suggested stockStatus from quantity. Admin may still override stockStatus manually. */
export function suggestStockStatus(quantity: number): StockStatus {
  if (quantity <= 0) return 'out_of_stock'
  if (quantity <= 3) return 'limited'
  return 'in_stock'
}

export function applyQuantityChange(
  quantity: number,
  overrideStatus?: StockStatus
): { quantity: number; stockStatus: StockStatus } {
  const qty = Math.max(0, Math.floor(quantity))
  return {
    quantity: qty,
    stockStatus: overrideStatus ?? suggestStockStatus(qty),
  }
}
