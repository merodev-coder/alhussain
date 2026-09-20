'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Cpu, MemoryStick, HardDrive, Monitor, ShoppingCart, X, ArrowUpLeft, Zap } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCart } from '@/lib/cart-context'
import type { Accessory, Product } from '@/lib/types'
import { cn } from '@/lib/utils'

type Props = {
  product: Product | Accessory
  open: boolean
  onOpenChange: (open: boolean) => void
}

function isLaptopProduct(item: Product | Accessory): item is Product {
  return 'cpu' in item
}

export default function QuickViewModal({ product, open, onOpenChange }: Props) {
  const { addItem, addAccessory } = useCart()
  const [activePhoto, setActivePhoto] = useState(0)

  const isLaptop = isLaptopProduct(product)
  const photos = product.photos?.length ? product.photos : ['/logo.jpeg']
  const isOutOfStock = product.stockStatus === 'out_of_stock'
  const isLimited = product.stockStatus === 'limited'
  const href = isLaptop
    ? `/laptops/${product.id}`
    : `/category/${(product as Accessory).homeSection || ''}`

  const specs = isLaptop
    ? [
        product.cpu ? { icon: Cpu, label: 'المعالج', value: product.cpu } : null,
        product.gpu ? { icon: Zap, label: 'كارت الشاشة', value: product.gpu } : null,
        product.ram ? { icon: MemoryStick, label: 'الرام', value: product.ram } : null,
        product.storage ? { icon: HardDrive, label: 'التخزين', value: product.storage } : null,
        product.screen ? { icon: Monitor, label: 'الشاشة', value: product.screen } : null,
      ].filter(Boolean)
    : []

  const handleAddToCart = () => {
    if (isOutOfStock) return
    if (isLaptop) {
      addItem(product)
    } else {
      addAccessory(product as Accessory)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!block max-w-[calc(100%-2rem)] overflow-hidden p-0 sm:max-w-xl sm:rounded-3xl lg:max-w-3xl"
      >
        <DialogTitle className="sr-only">{product.name}</DialogTitle>

        <button
          onClick={() => onOpenChange(false)}
          aria-label="إغلاق"
          className="absolute left-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-canvas/90 text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-surface-1"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid max-h-[85vh] grid-cols-1 overflow-y-auto sm:grid-cols-2 sm:overflow-visible">
          {/* Gallery */}
          <div className="flex flex-col gap-3 bg-surface-1 p-5 sm:p-6">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-canvas">
              <Image
                src={photos[activePhoto]}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 90vw, 40vw"
                className="object-contain p-4"
              />
              {isOutOfStock && (
                <span className="absolute bottom-3 right-3 rounded-full bg-inverse-canvas/85 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                  غير متوفر حالياً
                </span>
              )}
              {isLimited && !isOutOfStock && (
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                  <Zap className="h-3 w-3" />
                  كمية محدودة
                </span>
              )}
            </div>

            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {photos.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhoto(idx)}
                    className={cn(
                      'relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 bg-canvas transition-colors',
                      idx === activePhoto ? 'border-brand-primary' : 'border-transparent'
                    )}
                  >
                    <Image src={src} alt="" fill className="object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <div>
              {!isLaptop && (product as Accessory).category && (
                <span className="mb-2 inline-block w-fit rounded-full bg-surface-1 px-2.5 py-1 font-body text-[11px] text-ink-muted">
                  {(product as Accessory).category}
                </span>
              )}
              <h2 className="font-sans text-lg font-bold leading-snug text-ink sm:text-xl">
                {product.name}
              </h2>
            </div>

            {product.description && (
              <p className="line-clamp-3 font-body text-sm text-ink-muted">{product.description}</p>
            )}

            {specs.length > 0 && (
              <div className="grid grid-cols-1 gap-2 rounded-2xl bg-surface-1 p-3">
                {specs.map((spec, idx) =>
                  spec ? (
                    <div key={idx} className="flex items-center gap-2 font-body text-xs text-ink">
                      <spec.icon className="h-3.5 w-3.5 shrink-0 text-brand-primary" />
                      <span className="text-ink-muted">{spec.label}:</span>
                      <span className="font-medium">{spec.value}</span>
                    </div>
                  ) : null
                )}
              </div>
            )}

            <div className="mt-auto flex flex-col gap-3 pt-2">
              <span className="font-sans text-2xl font-extrabold text-ink">
                {product.price.toLocaleString('ar-EG')}
                <span className="ms-1 font-body text-sm font-medium text-ink-muted">ج.م</span>
              </span>

              <div className="flex gap-2">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-primary px-4 py-3 font-sans text-sm font-bold text-white transition-transform active:scale-95 hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingCart className="h-4 w-4" />
                  أضف للسلة
                </button>

                {isLaptop && (
                  <Link
                    href={href}
                    className="flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-hairline px-4 py-3 font-sans text-sm font-bold text-ink transition-colors hover:bg-surface-1"
                  >
                    التفاصيل
                    <ArrowUpLeft className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
