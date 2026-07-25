'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Minus, Plus, ShoppingCart, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart-context'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

const stockStyles = {
  in_stock: { label: 'متوفر', className: 'bg-green-100 text-green-700' },
  limited: { label: 'كمية محدودة', className: 'bg-amber-100 text-amber-700' },
  out_of_stock: { label: 'غير متوفر', className: 'bg-red-100 text-red-700' },
}

type Props = {
  product: Product
  allProducts: Product[]
}

export default function ProductDetailClient({ product, allProducts }: Props) {
  const [activePhoto, setActivePhoto] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  const handleAddToCart = () => {
    addItem(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const stock = stockStyles[product.stockStatus]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 font-body text-sm text-ink-muted mb-6">
        <Link href="/" className="hover:text-brand-primary transition-colors">الرئيسية</Link>
        <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        <Link href="/laptops" className="hover:text-brand-primary transition-colors">اللابتوبات</Link>
        <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        <span className="text-ink truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[4/3] rounded-[20px] overflow-hidden bg-surface-1">
            <Image
              src={product.photos[activePhoto]}
              alt={product.name}
              fill
              className="object-cover transition-opacity duration-300"
            />
            {product.discountBadge && (
              <span className="absolute top-4 start-4 bg-brand-accent text-white text-sm font-sans font-bold px-3 py-1 rounded-md">
                {product.discountBadge}
              </span>
            )}
          </div>
          {/* Thumbnails */}
          <div className="flex gap-2">
            {product.photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                className={cn(
                  'w-20 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0',
                  activePhoto === i ? 'border-brand-primary' : 'border-hairline hover:border-brand-primary/50'
                )}
              >
                <Image src={photo} alt={`صورة ${i + 1}`} width={80} height={64} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={cn('text-xs font-body font-medium px-3 py-1 rounded-full', stock.className)}>
                {stock.label}
              </span>
              {product.discountBadge && (
                <span className="bg-brand-accent text-white text-xs font-sans font-bold px-2 py-0.5 rounded-md">
                  {product.discountBadge}
                </span>
              )}
            </div>
            <h1 className="font-sans font-extrabold text-ink text-2xl md:text-3xl leading-snug text-balance">
              {product.name}
            </h1>
          </div>

          <div className="text-3xl font-sans font-extrabold text-ink">
            {product.price.toLocaleString('ar-EG')}{' '}
            <span className="text-lg font-body font-normal text-ink-muted">ج.م</span>
          </div>

          {/* Specs table */}
          <div className="bg-surface-1 rounded-[20px] overflow-hidden">
            <table className="w-full">
              <tbody>
                {[
                  { label: 'المعالج', value: product.cpu },
                  { label: 'كارت الشاشة', value: product.gpu },
                  { label: 'الرام', value: product.ram },
                  { label: 'التخزين', value: product.storage },
                ].map((spec, i) => (
                  <tr key={spec.label} className={cn('border-b border-hairline last:border-b-0', i % 2 === 0 ? 'bg-canvas' : 'bg-surface-1')}>
                    <td className="px-4 py-3 font-body text-sm font-semibold text-ink-muted w-1/3">{spec.label}</td>
                    <td className="px-4 py-3 font-body text-sm text-ink">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Description */}
          <p className="font-body text-ink-muted text-sm leading-relaxed">{product.description}</p>

          {/* Qty + Add to cart */}
          {product.stockStatus !== 'out_of_stock' && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-surface-1 rounded-full px-3 py-2 border border-hairline">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-full bg-canvas border border-hairline flex items-center justify-center hover:bg-surface-2 transition-colors"
                  aria-label="تقليل"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-body font-semibold w-6 text-center">{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  className="w-7 h-7 rounded-full bg-canvas border border-hairline flex items-center justify-center hover:bg-surface-2 transition-colors"
                  aria-label="زيادة"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <Button
                onClick={handleAddToCart}
                size="lg"
                className={cn(
                  'flex-1 rounded-full font-sans font-bold h-12 gap-2 active:scale-[0.97] transition-all',
                  added
                    ? 'bg-green-500 hover:bg-green-500 text-white'
                    : 'bg-brand-primary hover:bg-brand-primary/90 text-white'
                )}
              >
                {added ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    تمت الإضافة!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    أضف إلى السلة
                  </>
                )}
              </Button>
            </div>
          )}

          {product.stockStatus === 'out_of_stock' && (
            <div className="bg-red-50 border border-red-100 rounded-[20px] p-4 text-center">
              <p className="font-body text-sm text-red-600">هذا المنتج غير متوفر حالياً. تواصل معنا على واتساب لمعرفة موعد التوفر.</p>
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      <section className="mt-16">
        <h2 className="font-sans font-bold text-ink text-2xl mb-6">منتجات مشابهة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {allProducts.filter(p => p.id !== product.id).slice(0, 4).map(p => {
            const stockInfo = stockStyles[p.stockStatus]
            return (
              <Link
                key={p.id}
                href={`/laptops/${p.id}`}
                className="group bg-canvas rounded-[20px] border border-hairline card-hover overflow-hidden"
              >
                <div className="aspect-[4/3] overflow-hidden bg-surface-1">
                  <Image
                    src={p.photos[0]}
                    alt={p.name}
                    width={300}
                    height={225}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <p className="font-sans font-bold text-sm text-ink line-clamp-2 mb-2">{p.name}</p>
                  <p className="font-sans font-bold text-brand-primary">{p.price.toLocaleString('ar-EG')} ج.م</p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Sticky Add-to-Cart bar (mobile) */}
      {product.stockStatus !== 'out_of_stock' && (
        <div className="lg:hidden fixed bottom-0 start-0 end-0 z-40 bg-canvas border-t border-hairline px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="font-sans font-bold text-ink text-sm line-clamp-1">{product.name}</p>
            <p className="font-sans font-bold text-brand-primary text-sm">{product.price.toLocaleString('ar-EG')} ج.م</p>
          </div>
          <Button
            onClick={handleAddToCart}
            className={cn(
              'rounded-full font-sans font-bold h-10 gap-2 active:scale-[0.97] transition-all px-6 shrink-0',
              added ? 'bg-green-500 text-white' : 'bg-brand-primary text-white'
            )}
          >
            {added ? <CheckCircle className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            {added ? 'تمت الإضافة' : 'أضف للسلة'}
          </Button>
        </div>
      )}
    </div>
  )
}
