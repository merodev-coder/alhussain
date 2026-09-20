'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Cpu, MemoryStick, HardDrive, ArrowUpLeft, Zap, Eye, ShoppingCart } from 'lucide-react'
import type { Accessory, Product } from '@/lib/types'
import { useCart } from '@/lib/cart-context'
import QuickViewModal from '@/components/product-quick-view'

interface ProductCardProps {
  product: Product | Accessory
}

// A laptop Product has cpu/gpu/ram/storage fields; an Accessory doesn't.
// Distinguishing the two lets this one card component serve every homepage
// row (laptops and the 7 accessory categories) without showing empty/
// meaningless spec chips on a mouse or a charger.
function isLaptopProduct(item: Product | Accessory): item is Product {
  return 'cpu' in item
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, addAccessory } = useCart()
  const [quickViewOpen, setQuickViewOpen] = useState(false)

  const imageSrc =
    product.photos && product.photos.length > 0 ? product.photos[0] : '/logo.jpeg'

  const isLaptop = isLaptopProduct(product)
  const cpu = isLaptop ? product.specs?.cpu || product.cpu : ''
  const ram = isLaptop ? product.specs?.ram || product.ram : ''
  const storage = isLaptop ? product.specs?.storage || product.storage : ''

  const specChips = [
    cpu ? { icon: Cpu, label: cpu } : null,
    ram ? { icon: MemoryStick, label: ram } : null,
    storage ? { icon: HardDrive, label: storage } : null,
  ].filter(Boolean) as { icon: typeof Cpu; label: string }[]

  // Non-laptop items show their free-form category instead of spec chips.
  const categoryLabel = !isLaptop ? product.category : ''
  const badgeLabel = isLaptop ? product.badge || product.discountBadge : ''

  const isOutOfStock = product.stockStatus === 'out_of_stock'
  const isLimited = product.stockStatus === 'limited'
  const href = isLaptop ? `/laptops/${product.id}` : `/category/${(product as Accessory).homeSection || ''}`

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setQuickViewOpen(true)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return
    if (isLaptop) {
      addItem(product)
    } else {
      addAccessory(product as Accessory)
    }
  }

  return (
    <>
      <Link
        href={href}
        className="product-card group relative flex h-full flex-col select-none"
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-canvas shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-brand-primary/30 group-hover:shadow-lg">
          {/* Image area */}
          <div className="relative w-full aspect-[4/3] overflow-hidden bg-surface-1">

            <Image
              src={imageSrc}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 280px"
              loading="lazy"
              className="object-contain p-5 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            />

            {/* Badge ribbon, top-right, tilted like a price tag */}
            {badgeLabel && (
              <span className="absolute -right-1 top-3 z-20 rotate-3 rounded-l-full bg-brand-accent px-3 py-1 text-[11px] font-extrabold text-white shadow-md">
                {badgeLabel}
              </span>
            )}

            {/* Quick actions — top of the card, revealed on hover (always visible on touch) */}
            <div className="absolute top-2.5 start-2.5 z-20 flex flex-col gap-1.5 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
              <button
                onClick={handleQuickView}
                aria-label="عرض سريع"
                title="عرض سريع"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas/95 text-ink shadow-md backdrop-blur-sm transition-colors hover:bg-brand-primary hover:text-white"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                aria-label="أضف للسلة"
                title="أضف للسلة"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas/95 text-ink shadow-md backdrop-blur-sm transition-colors hover:bg-brand-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-canvas/95 disabled:hover:text-ink"
              >
                <ShoppingCart className="h-4 w-4" />
              </button>
            </div>

            {/* Stock indicator */}
            {isOutOfStock ? (
              <span className="absolute bottom-3 left-3 z-20 rounded-full bg-inverse-canvas/85 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                غير متوفر حالياً
              </span>
            ) : isLimited ? (
              <span className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                <Zap className="h-3 w-3" />
                كمية محدودة
              </span>
            ) : null}
          </div>

          {/* Details area */}
          <div className="flex flex-1 flex-col gap-3 p-4 pb-5 text-right sm:p-5">
            <h3 className="min-h-[2.6em] font-sans text-sm font-bold leading-snug text-ink transition-colors line-clamp-2 group-hover:text-brand-primary sm:text-base">
              {product.name}
            </h3>

            {specChips.length > 0 ? (
              <div className="flex flex-wrap gap-1.5" dir="ltr">
                {specChips.map((chip, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-full bg-surface-1 px-2 py-1 text-[10px] font-medium text-ink-muted transition-colors group-hover:bg-brand-primary/10 sm:text-[11px]"
                  >
                    <chip.icon className="h-3 w-3 shrink-0" />
                    <span className="max-w-[110px] truncate">{chip.label}</span>
                  </span>
                ))}
              </div>
            ) : categoryLabel ? (
              <span className="w-fit rounded-full bg-surface-1 px-2.5 py-1 text-[10px] font-medium text-ink-muted transition-colors group-hover:bg-brand-primary/10 sm:text-[11px]">
                {categoryLabel}
              </span>
            ) : null}

            {/* Price + CTA — price sits in a notched pill, CTA is a floating circular arrow */}
            <div className="mt-auto flex items-center justify-between gap-2 pt-3">
              <div className="relative flex items-baseline gap-1 rounded-xl bg-brand-primary/10 px-3 py-1.5">
                <span className="font-sans text-base font-extrabold text-brand-primary sm:text-lg">
                  {product.price.toLocaleString('ar-EG')}
                </span>
                <span className="text-[10px] font-semibold text-brand-primary/80">ج.م</span>
              </div>

              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-inverse-canvas text-white shadow-sm transition-colors duration-300 group-hover:bg-brand-primary sm:h-10 sm:w-10">
                <ArrowUpLeft className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>

      <QuickViewModal product={product} open={quickViewOpen} onOpenChange={setQuickViewOpen} />
    </>
  )
}
