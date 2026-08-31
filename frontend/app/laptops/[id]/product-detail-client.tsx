'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import useSWR from 'swr'
import { ChevronRight, Minus, Plus, ShoppingCart, CheckCircle, PackagePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart-context'
import { fetcher } from '@/lib/fetcher'
import type { Product, Addon, SelectedAddon } from '@/lib/types'
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
  const [selectedAddonsMap, setSelectedAddonsMap] = useState<Record<string, number>>({})
  const [showPopupModal, setShowPopupModal] = useState(false)

  // Handle empty photos array
  const photos = product.photos && product.photos.length > 0 ? product.photos : ['/placeholder-laptop.jpg']

  const { addItem } = useCart()

  const { data: addonsData } = useSWR<Addon[]>(
    `/api/addons?compatibleWith=${product.id}`,
    fetcher
  )

  const compatibleAddons = addonsData || []

  const toggleAddon = (addonId: string) => {
    setSelectedAddonsMap(prev => {
      const next = { ...prev }
      if (next[addonId]) {
        delete next[addonId]
      } else {
        next[addonId] = 1
      }
      return next
    })
  }

  const updateAddonQty = (addonId: string, delta: number) => {
    setSelectedAddonsMap(prev => {
      const current = prev[addonId] || 0
      const nextQty = current + delta
      if (nextQty <= 0) {
        const next = { ...prev }
        delete next[addonId]
        return next
      }
      return { ...prev, [addonId]: nextQty }
    })
  }

  const getSelectedAddonsList = (): SelectedAddon[] => {
    return Object.entries(selectedAddonsMap)
      .map(([addonId, addonQty]) => {
        const addon = compatibleAddons.find(a => a.id === addonId)
        if (!addon) return null
        return {
          addonId: addon.id,
          name: addon.name,
          price: addon.price,
          qty: addonQty,
        }
      })
      .filter((x): x is SelectedAddon => x !== null)
  }

  const executeAddToCart = () => {
    const addonsList = getSelectedAddonsList()
    addItem(product, qty, addonsList, 'laptop')
    setAdded(true)
    setShowPopupModal(false)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleAddToCartClick = () => {
    const selectedCount = Object.keys(selectedAddonsMap).length
    // If user hasn't picked any addons and there are compatible addons available, suggest them via popup modal
    if (selectedCount === 0 && compatibleAddons.length > 0) {
      setShowPopupModal(true)
    } else {
      executeAddToCart()
    }
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
              src={photos[activePhoto]}
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
            {photos.map((photo, i) => (
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

          {/* Compatible Addons List */}
          {compatibleAddons.length > 0 && (
            <div className="bg-canvas border border-hairline rounded-[20px] p-4">
              <div className="flex items-center gap-2 mb-3">
                <PackagePlus className="w-4 h-4 text-brand-primary" />
                <h3 className="font-sans font-bold text-ink text-sm">ترقيات وإضافات متوافقة (اختياري)</h3>
              </div>
              <div className="space-y-2">
                {compatibleAddons.map(addon => {
                  const isChecked = !!selectedAddonsMap[addon.id]
                  const addonQty = selectedAddonsMap[addon.id] || 1

                  return (
                    <div
                      key={addon.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-xl border transition-colors',
                        isChecked ? 'border-brand-primary bg-surface-2/50' : 'border-hairline bg-surface-1'
                      )}
                    >
                      <label className="flex items-center gap-3 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAddon(addon.id)}
                          className="w-4 h-4 rounded border-hairline text-brand-primary focus:ring-[#0FC7C1]"
                        />
                        <div>
                          <p className="font-body text-xs font-semibold text-ink">{addon.name}</p>
                          <p className="font-sans font-bold text-xs text-brand-primary">
                            +{addon.price.toLocaleString('ar-EG')} ج.م
                          </p>
                        </div>
                      </label>

                      {isChecked && (
                        <div className="flex items-center gap-1.5 bg-canvas border border-hairline rounded-full px-2 py-1 ms-2">
                          <button
                            type="button"
                            onClick={() => updateAddonQty(addon.id, -1)}
                            className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-surface-2"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-body text-xs font-bold w-4 text-center">{addonQty}</span>
                          <button
                            type="button"
                            onClick={() => updateAddonQty(addon.id, 1)}
                            className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-surface-2"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
                onClick={handleAddToCartClick}
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

      {/* Suggested Addons Popup Dialog */}
      {showPopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPopupModal(false)} />
          <div className="relative bg-canvas border border-hairline rounded-[24px] w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-brand-primary" />
                <h3 className="font-sans font-bold text-ink text-base">هل ترغب بإضافة ملحقات للجهاز؟</h3>
              </div>
              <button
                onClick={() => setShowPopupModal(false)}
                className="w-7 h-7 rounded-full hover:bg-surface-1 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-body text-xs text-ink-muted">
              أضف رام إضافية، هارد SSD إضافي، أو ملصقات كيبورد مع جهازك بسهولة:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {compatibleAddons.map(addon => {
                const isChecked = !!selectedAddonsMap[addon.id]
                return (
                  <label
                    key={addon.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors',
                      isChecked ? 'border-brand-primary bg-surface-2/60' : 'border-hairline bg-surface-1'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAddon(addon.id)}
                        className="w-4 h-4 rounded border-hairline text-brand-primary focus:ring-[#0FC7C1]"
                      />
                      <div>
                        <p className="font-body text-xs font-semibold text-ink">{addon.name}</p>
                        <p className="font-sans font-bold text-xs text-brand-primary">
                          +{addon.price.toLocaleString('ar-EG')} ج.م
                        </p>
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>

            <div className="flex gap-2 pt-3 border-t border-hairline">
              <button
                onClick={executeAddToCart}
                className="flex-1 py-2.5 rounded-full border border-hairline font-body text-xs text-ink hover:bg-surface-1"
              >
                تخطي ومتابعة
              </button>
              <button
                onClick={executeAddToCart}
                className="flex-1 py-2.5 rounded-full bg-brand-primary text-white font-sans font-bold text-xs hover:bg-brand-primary/90"
              >
                إضافة وإضافة للسلة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Related products */}
      <section className="mt-16">
        <h2 className="font-sans font-bold text-ink text-2xl mb-6">منتجات مشابهة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {allProducts.filter(p => p.id !== product.id).slice(0, 4).map(p => {
            const pPhotos = p.photos && p.photos.length > 0 ? p.photos : ['/placeholder-laptop.jpg']
            return (
              <Link
                key={p.id}
                href={`/laptops/${p.id}`}
                className="group bg-canvas rounded-[20px] border border-hairline card-hover overflow-hidden"
              >
                <div className="aspect-[4/3] overflow-hidden bg-surface-1">
                  <Image
                    src={pPhotos[0]}
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
            onClick={handleAddToCartClick}
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

