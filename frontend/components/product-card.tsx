'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Cpu, MemoryStick, HardDrive, Zap } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

type Props = {
  product: Product
  className?: string
}

const STOCK_STYLES: Record<Product['stockStatus'], { label: string; dot: string; text: string }> = {
  in_stock: { label: 'متوفر', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  limited: { label: 'كمية محدودة', dot: 'bg-amber-500', text: 'text-amber-700' },
  out_of_stock: { label: 'غير متوفر', dot: 'bg-red-500', text: 'text-red-600' },
}

export default function ProductCard({ product, className }: Props) {
  const { addItem } = useCart()
  const stock = STOCK_STYLES[product.stockStatus]
  const isOutOfStock = product.stockStatus === 'out_of_stock'

  const specChips = [
    product.cpu ? { icon: Cpu, label: product.cpu.split(' ').slice(0, 3).join(' ') } : null,
    product.ram ? { icon: MemoryStick, label: product.ram } : null,
    product.storage ? { icon: HardDrive, label: product.storage } : null,
  ].filter(Boolean) as { icon: typeof Cpu; label: string }[]

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-hairline bg-canvas transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-brand-primary/30',
        className
      )}
    >
      {/* Image */}
      <Link href={`/laptops/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-surface-1">
        <Image
          src={product.photos[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 start-3 z-10 flex flex-col gap-1">
          {product.discountBadge && (
            <span className="inline-block rounded-md bg-brand-accent px-2 py-0.5 font-sans text-xs font-bold text-white shadow-sm">
              {product.discountBadge}
            </span>
          )}
        </div>

        {product.stockStatus === 'limited' && (
          <span className="absolute bottom-2.5 start-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
            <Zap className="h-3 w-3" />
            كمية محدودة
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute bottom-2.5 start-2.5 z-10 rounded-full bg-inverse-canvas/85 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            غير متوفر حالياً
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <Link href={`/laptops/${product.id}`}>
          <h3 className="min-h-[2.6em] font-sans text-sm font-bold leading-snug text-ink line-clamp-2 transition-colors hover:text-brand-primary sm:text-base">
            {product.name}
          </h3>
        </Link>

        {specChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5" dir="ltr">
            {specChips.map((chip, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-full bg-surface-1 px-2 py-1 text-[10px] font-medium text-ink-muted sm:text-[11px]"
              >
                <chip.icon className="h-3 w-3 shrink-0" />
                <span className="max-w-[100px] truncate">{chip.label}</span>
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="flex flex-col gap-1">
            <span className="font-sans text-lg font-extrabold text-ink sm:text-xl">
              {product.price.toLocaleString('ar-EG')}
              <span className="ms-1 font-body text-xs font-medium text-ink-muted">ج.م</span>
            </span>
            <span className={cn('flex items-center gap-1.5 font-body text-[11px] font-medium', stock.text)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', stock.dot)} />
              {stock.label}
            </span>
          </div>

          <button
            onClick={() => addItem(product)}
            disabled={isOutOfStock}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-primary px-4 py-2.5 font-sans text-xs font-bold text-white transition-transform active:scale-95 hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            أضف
          </button>
        </div>
      </div>
    </div>
  )
}
