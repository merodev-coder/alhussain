/** Suggested stockStatus from quantity. Admin may still override stockStatus manually. */
export function suggestStockStatus(quantity) {
    if (quantity <= 0)
        return 'out_of_stock';
    if (quantity <= 3)
        return 'limited';
    return 'in_stock';
}
export function applyQuantityChange(quantity, overrideStatus) {
    const qty = Math.max(0, Math.floor(quantity));
    return {
        quantity: qty,
        stockStatus: overrideStatus ?? suggestStockStatus(qty),
    };
}
