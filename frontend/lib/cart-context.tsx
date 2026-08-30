'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { CartItem, Product, Accessory, SelectedAddon } from './types'

type CartContextType = {
  items: CartItem[]
  addItem: (
    product: Product | Accessory,
    qty?: number,
    selectedAddons?: SelectedAddon[],
    itemType?: 'laptop' | 'accessory'
  ) => void
  addAccessory: (accessory: Accessory, qty?: number) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clearCart: () => void
  total: number
  count: number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)

const CART_STORAGE_KEY = 'alhussain_cart'

function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveCartToStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Ignore storage errors
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const stored = getStoredCart()
    setItems(stored)
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      saveCartToStorage(items)
    }
  }, [items, isHydrated])

  const addItem = (
    product: Product | Accessory,
    qty = 1,
    selectedAddons: SelectedAddon[] = [],
    itemType: 'laptop' | 'accessory' = 'laptop'
  ) => {
    setItems(prev => {
      // Find item with same product ID AND same addons signature
      const addonsSig = (addons: SelectedAddon[] = []) =>
        addons
          .map(a => `${a.addonId}:${a.qty}`)
          .sort()
          .join(',')

      const targetSig = addonsSig(selectedAddons)

      const existingIndex = prev.findIndex(
        i => i.product.id === product.id && addonsSig(i.selectedAddons) === targetSig
      )

      if (existingIndex > -1) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + qty,
        }
        return updated
      }

      return [...prev, { itemType, product, qty, selectedAddons }]
    })
    setIsOpen(true)
  }

  const addAccessory = (accessory: Accessory, qty = 1) => {
    addItem(accessory, qty, [], 'accessory')
  }

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId))
  }

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId)
      return
    }
    setItems(prev => prev.map(i => (i.product.id === productId ? { ...i, qty } : i)))
  }

  const clearCart = () => setItems([])

  const total = items.reduce((sum, i) => {
    const addonsPrice = (i.selectedAddons || []).reduce((a, ad) => a + ad.price * ad.qty, 0)
    return sum + (i.product.price + addonsPrice) * i.qty
  }, 0)

  const count = items.reduce((sum, i) => sum + i.qty, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addAccessory,
        removeItem,
        updateQty,
        clearCart,
        total,
        count,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

