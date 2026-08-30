'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import useSWR from 'swr'
import { ShoppingCart, Search, Filter, Headphones } from 'lucide-react'
import StoreLayout from '@/components/store-layout'
import { fetcher } from '@/lib/fetcher'
import { useCart } from '@/lib/cart-context'
import type { Accessory } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const stockLabel: Record<Accessory['stockStatus'], { label: string; className: string }> = {
  in_stock: { label: 'متوفر', className: 'bg-green-100 text-green-700' },
  limited: { label: 'كمية محدودة', className: 'bg-amber-100 text-amber-700' },
  out_of_stock: { label: 'غير متوفر', className: 'bg-red-100 text-red-700' },
}

function AccessoryCard({ accessory }: { accessory: Accessory }) {
  const { addAccessory } = useCart()
  const stock = stockLabel[accessory.stockStatus]

  return (
    <div className="group relative bg-canvas rounded-[20px] border border-hairline card-hover overflow-hidden flex flex-col justify-between p-4">
      <div>
        <div className="relative aspect-square rounded-[16px] overflow-hidden bg-surface-1 mb-3">
          {accessory.photos?.[0] ? (
            <Image
              src={accessory.photos[0]}
              alt={accessory.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-muted">
              <Headphones className="w-10 h-10" />
            </div>
          )}
          <span className={cn('absolute top-2 start-2 text-xs font-body font-medium px-2 py-0.5 rounded-md shadow-sm', stock.className)}>
            {stock.label}
          </span>
        </div>

        <span className="text-[11px] font-body text-ink-muted bg-surface-1 px-2 py-0.5 rounded-md inline-block mb-1">
          {accessory.category}
        </span>
        <h3 className="font-sans font-bold text-ink text-base leading-snug line-clamp-2 mb-2">
          {accessory.name}
        </h3>
        {accessory.description && (
          <p className="font-body text-xs text-ink-muted line-clamp-2 mb-3">
            {accessory.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-hairline">
        <span className="font-sans font-bold text-xl text-ink">
          {accessory.price.toLocaleString('ar-EG')}{' '}
          <span className="text-xs text-ink-muted font-body">ج.م</span>
        </span>
        <button
          onClick={() => addAccessory(accessory)}
          disabled={accessory.stockStatus === 'out_of_stock'}
          className="rounded-full bg-brand-primary hover:bg-brand-primary/90 text-white text-xs px-4 py-2 font-sans font-bold flex items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          أضف للسلة
        </button>
      </div>
    </div>
  )
}

export default function AccessoriesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const { data, isLoading } = useSWR<{ items: Accessory[]; total: number; page: number; pages: number }>(
    `/api/accessories?page=${page}&search=${encodeURIComponent(search)}`,
    fetcher
  )

  const accessories = data?.items ?? []
  const totalPages = data?.pages || 1

  const categories = useMemo(() => {
    const set = new Set<string>()
    accessories.forEach(a => {
      if (a.category) set.add(a.category)
    })
    return Array.from(set)
  }, [accessories])

  const filtered = useMemo(() => {
    return accessories.filter(a => {
      if (!a.visible) return false
      if (selectedCategory !== 'all' && a.category !== selectedCategory) return false
      return true
    })
  }, [accessories, selectedCategory])

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-sans font-bold text-ink text-3xl">الإكسسوارات والملحقات</h1>
            <p className="font-body text-ink-muted text-sm mt-1">
              تصفح تشكيلة واسعة من الحقائب، الماوسات، الشواحن، والسماعات المتميزة
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="ابحث عن إكسسوار..."
              className="w-full ps-9 pe-4 py-2 rounded-full border border-hairline font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
            />
          </div>
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-body font-semibold transition-colors',
                selectedCategory === 'all'
                  ? 'bg-brand-primary text-white'
                  : 'bg-surface-1 text-ink-muted hover:bg-surface-2'
              )}
            >
              الكل
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-full text-xs font-body font-semibold transition-colors',
                  selectedCategory === cat
                    ? 'bg-brand-primary text-white'
                    : 'bg-surface-1 text-ink-muted hover:bg-surface-2'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-canvas rounded-[20px] border border-hairline p-4 space-y-3">
                <Skeleton className="aspect-square w-full rounded-[16px]" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-surface-1 flex items-center justify-center">
              <Headphones className="w-8 h-8 text-ink-muted" />
            </div>
            <h3 className="font-sans font-bold text-ink text-xl">لا توجد إكسسوارات</h3>
            <p className="font-body text-ink-muted text-sm">جرب البحث بكلمات أخرى أو اختر فئة مختلفة.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filtered.map(acc => (
                <AccessoryCard key={acc.id} accessory={acc} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-full border border-hairline font-body text-sm text-ink hover:bg-surface-1 disabled:opacity-50"
                >
                  السابق
                </button>
                <span className="font-body text-sm text-ink-muted">
                  الصفحة {page} من {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-full border border-hairline font-body text-sm text-ink hover:bg-surface-1 disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </StoreLayout>
  )
}
