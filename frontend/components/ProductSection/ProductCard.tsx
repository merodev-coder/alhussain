'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Cpu, MemoryStick, HardDrive, ArrowUpLeft, Zap } from 'lucide-react'
import type { Product } from '@/lib/types'

interface ProductCardProps {
  product: Product
}

// Angled corner-cut shape shared by every product card — the site's signature silhouette
const CARD_CLIP =
  'polygon(0 18px, 18px 0, 100% 0, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0 100%)'

export default function ProductCard({ product }: ProductCardProps) {
  const imageSrc =
    product.photos && product.photos.length > 0 ? product.photos[0] : '/logo.jpeg'

  const cpu = product.specs?.cpu || product.cpu
  const ram = product.specs?.ram || product.ram
  const storage = product.specs?.storage || product.storage

  const specChips = [
    cpu ? { icon: Cpu, label: cpu } : null,
    ram ? { icon: MemoryStick, label: ram } : null,
    storage ? { icon: HardDrive, label: storage } : null,
  ].filter(Boolean) as { icon: typeof Cpu; label: string }[]

  const isOutOfStock = product.stockStatus === 'out_of_stock'
  const isLimited = product.stockStatus === 'limited'

  return (
    <Link
      href={`/laptops/${product.id}`}
      className="product-card group relative flex h-full flex-col select-none"
    >
      {/* Glow halo that blooms behind the card on hover */}
      <div
        aria-hidden="true"
        className="absolute -inset-1.5 rounded-[26px] bg-gradient-to-br from-brand-primary/40 via-brand-accent/20 to-brand-primary/0 opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-100"
      />

      <div
        className="product-card-body relative flex h-full flex-col overflow-hidden bg-canvas ring-1 ring-hairline shadow-sm transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:ring-brand-primary/50"
        style={{ clipPath: CARD_CLIP }}
      >
        {/* Corner fold accent (top-left) echoing the clipped corner */}
        <div className="pointer-events-none absolute left-0 top-0 h-[18px] w-[18px] bg-brand-primary/25 transition-colors duration-500 group-hover:bg-brand-primary" />

        {/* Image area */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-gradient-to-br from-surface-1 to-surface-2">
          {/* Diagonal sheen sweep */}
          <div className="pointer-events-none absolute inset-y-0 -left-1/2 z-10 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-all duration-700 group-hover:left-[130%] group-hover:opacity-100" />

          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 280px"
            loading="lazy"
            className="object-contain p-5 transition-transform duration-500 ease-out group-hover:scale-[1.08] group-hover:-rotate-1"
          />

          {/* Badge ribbon, top-right, tilted like a price tag */}
          {(product.badge || product.discountBadge) && (
            <span className="absolute -right-1 top-3 z-20 rotate-3 rounded-l-full bg-brand-accent px-3 py-1 text-[11px] font-extrabold text-white shadow-md">
              {product.badge || product.discountBadge}
            </span>
          )}

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

          {specChips.length > 0 && (
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
          )}

          {/* Price + CTA — price sits in a notched pill, CTA is a floating circular arrow */}
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <div className="relative flex items-baseline gap-1 rounded-xl bg-brand-primary/10 px-3 py-1.5">
              <span className="font-sans text-base font-extrabold text-brand-primary sm:text-lg">
                {product.price.toLocaleString('ar-EG')}
              </span>
              <span className="text-[10px] font-semibold text-brand-primary/80">ج.م</span>
            </div>

            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-inverse-canvas text-white shadow-md transition-all duration-300 group-hover:rotate-45 group-hover:bg-brand-primary sm:h-10 sm:w-10">
              <ArrowUpLeft className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
