'use client'

import Image from 'next/image'
import { ShoppingCart, PackageSearch, Zap } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import type { Accessory } from '@/lib/types'
import { cn } from '@/lib/utils'

type Props = {
  accessory: Accessory
  className?: string
}

const STOCK_STYLES: Record<Accessory['stockStatus'], { label: string; dot: string; text: string }> = {
  in_stock: { label: 'متوفر', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  limited: { label: 'كمية محدودة', dot: 'bg-amber-500', text: 'text-amber-700' },
  out_of_stock: { label: 'غير متوفر', dot: 'bg-red-500', text: 'text-red-600' },
}

export default function AccessoryCard({ accessory, className }: Props) {
  const { addAccessory } = useCart()
  const stock = STOCK_STYLES[accessory.stockStatus]
  const isOutOfStock = accessory.stockStatus === 'out_of_stock'

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-hairline bg-canvas transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-brand-primary/30',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-surface-1">
        {accessory.photos?.[0] ? (
          <Image
            src={accessory.photos[0]}
            alt={accessory.name}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-muted/50">
            <PackageSearch className="h-10 w-10" />
          </div>
        )}

        {accessory.stockStatus === 'limited' && (
          <span className="absolute top-2.5 start-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
            <Zap className="h-3 w-3" />
            كمية محدودة
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute top-2.5 start-2.5 z-10 rounded-full bg-inverse-canvas/85 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            غير متوفر حالياً
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {accessory.category && (
          <span className="w-fit rounded-md bg-surface-1 px-2 py-0.5 font-body text-[11px] text-ink-muted">
            {accessory.category}
          </span>
        )}

        <h3 className="font-sans text-sm font-bold leading-snug text-ink line-clamp-2 sm:text-base">
          {accessory.name}
        </h3>

        {accessory.description && (
          <p className="line-clamp-2 font-body text-xs text-ink-muted">{accessory.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div className="flex flex-col gap-1">
            <span className="font-sans text-lg font-extrabold text-ink sm:text-xl">
              {accessory.price.toLocaleString('ar-EG')}
              <span className="ms-1 font-body text-xs font-medium text-ink-muted">ج.م</span>
            </span>
            <span className={cn('flex items-center gap-1.5 font-body text-[11px] font-medium', stock.text)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', stock.dot)} />
              {stock.label}
            </span>
          </div>

          <button
            onClick={() => addAccessory(accessory)}
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
