'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart-context'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

type Props = {
  product: Product
  className?: string
}

const stockLabel: Record<Product['stockStatus'], { label: string; className: string }> = {
  in_stock: { label: 'متوفر', className: 'bg-green-100 text-green-700' },
  limited: { label: 'كمية محدودة', className: 'bg-amber-100 text-amber-700' },
  out_of_stock: { label: 'غير متوفر', className: 'bg-red-100 text-red-700' },
}

export default function ProductCard({ product, className }: Props) {
  const { addItem } = useCart()
  const stock = stockLabel[product.stockStatus]

  return (
    <div className={cn('group relative bg-canvas rounded-[20px] border border-hairline card-hover overflow-hidden flex flex-col', className)}>
      {/* Badges */}
      <div className="absolute top-3 start-3 z-10 flex flex-col gap-1">
        {product.discountBadge && (
          <span className="inline-block bg-brand-accent text-white text-xs font-sans font-bold px-2 py-0.5 rounded-md">
            {product.discountBadge}
          </span>
        )}
      </div>

      {/* Image */}
      <Link href={`/laptops/${product.id}`} className="block overflow-hidden bg-surface-1 aspect-[4/3]">
        <Image
          src={product.photos[0]}
          alt={product.name}
          width={400}
          height={300}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/laptops/${product.id}`} className="flex-1">
            <h3 className="font-sans font-bold text-ink text-base leading-snug hover:text-brand-primary transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
          <span className={cn('text-xs font-body font-medium px-2 py-0.5 rounded-md shrink-0', stock.className)}>
            {stock.label}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mt-1">
          <span className="text-xs font-body text-ink-muted bg-surface-1 px-2 py-0.5 rounded-md">{product.cpu.split(' ').slice(0,3).join(' ')}</span>
          <span className="text-xs font-body text-ink-muted bg-surface-1 px-2 py-0.5 rounded-md">{product.ram}</span>
          <span className="text-xs font-body text-ink-muted bg-surface-1 px-2 py-0.5 rounded-md">{product.storage}</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-3">
          <span className="font-sans font-bold text-xl text-ink">
            {product.price.toLocaleString('ar-EG')} <span className="text-sm text-ink-muted font-body">ج.م</span>
          </span>
          <Button
            size="sm"
            onClick={() => addItem(product)}
            disabled={product.stockStatus === 'out_of_stock'}
            className="rounded-full bg-brand-primary hover:bg-brand-primary/90 text-white text-xs gap-1 active:scale-95 transition-transform"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            أضف
          </Button>
        </div>
      </div>
    </div>
  )
}
