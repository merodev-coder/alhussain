'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Cpu, MemoryStick, HardDrive } from 'lucide-react'
import type { Product } from '@/lib/types'

interface ProductCardProps {
  product: Product
}

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
      className="group relative flex flex-col overflow-hidden rounded-[22px] bg-canvas border border-hairline shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-brand-primary/40 transition-all duration-300 select-none"
    >
      {/* Image area with soft brand-tinted backdrop */}
      <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-surface-1 to-surface-2 overflow-hidden">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 280px"
          loading="lazy"
          className="object-contain p-5 group-hover:scale-[1.06] transition-transform duration-500"
        />

        {/* Badge */}
        {(product.badge || product.discountBadge) && (
          <span className="absolute top-3 right-3 bg-brand-accent text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            {product.badge || product.discountBadge}
          </span>
        )}

        {/* Stock indicator */}
        {isOutOfStock ? (
          <span className="absolute top-3 left-3 bg-inverse-canvas/85 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
            غير متوفر حالياً
          </span>
        ) : isLimited ? (
          <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            كمية محدودة
          </span>
        ) : null}
      </div>

      {/* Details area with breathing room */}
      <div className="flex flex-col gap-3 p-4 sm:p-5 text-right">
        <h3 className="font-sans font-bold text-sm sm:text-base text-ink line-clamp-2 leading-snug group-hover:text-brand-primary transition-colors min-h-[2.6em]">
          {product.name}
        </h3>

        {/* Spec chips instead of a cramped single line */}
        {specChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5" dir="ltr">
            {specChips.map((chip, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 bg-surface-1 text-ink-muted text-[10px] sm:text-[11px] font-medium px-2 py-1 rounded-lg"
              >
                <chip.icon className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[110px]">{chip.label}</span>
              </span>
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="mt-1 pt-3 border-t border-hairline flex items-center justify-between gap-2">
          <span className="font-sans font-extrabold text-base sm:text-lg text-brand-primary">
            {product.price.toLocaleString('ar-EG')}
            <span className="text-xs font-semibold text-ink-muted mr-1">ج.م</span>
          </span>

          <span className="inline-flex items-center justify-center text-xs font-bold text-white bg-inverse-canvas group-hover:bg-brand-primary rounded-xl px-3 py-2 transition-colors">
            التفاصيل
          </span>
        </div>
      </div>
    </Link>
  )
}
