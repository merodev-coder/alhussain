'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  RefreshCw,
  Search,
  Cpu,
  HardDrive,
  Monitor,
  Zap,
  Phone,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react'
import StoreLayout from '@/components/store-layout'
import api from '@/lib/api'
import { clientLogger } from '@/lib/client-logger'
import { cn } from '@/lib/utils'

interface StructuredLaptopItem {
  id?: string
  index?: number
  brand: string
  model: string
  name: string
  cpu: string
  ram: string
  storage: string
  screen: string
  gpu: string
  price: number
  category?: string
  flagged?: boolean
  flagReason?: string
}

interface PricelistResponse {
  id?: string
  sourceFileName?: string
  structuredItems?: StructuredLaptopItem[]
  generatedHtml?: string
  parsedHtml?: string
  uploadedAt: string
  published: boolean
}

export default function PricelistPage() {
  const [priceList, setPriceList] = useState<PricelistResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    const fetchPriceList = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await api.get_pricelist()
        setPriceList(data)
      } catch (err) {
        clientLogger.error('Failed to fetch pricelist:', err)
        setError(err instanceof Error ? err.message : 'فشل تحميل قائمة الأسعار')
        setPriceList(null)
      } finally {
        setLoading(false)
      }
    }
    fetchPriceList()
  }, [])

  const items = priceList?.structuredItems || []

  // Extract distinct categories in the order they appear
  const categories = useMemo(() => {
    const set = new Set<string>()
    items.forEach(it => {
      if (it.category) set.add(it.category)
    })
    return Array.from(set)
  }, [items])

  // Filter items by search query and category
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory

      if (!matchesCategory) return false

      if (!searchQuery.trim()) return true

      const query = searchQuery.trim().toLowerCase()
      const haystack = [
        item.name,
        item.brand,
        item.model,
        item.cpu,
        item.gpu,
        item.ram,
        item.storage,
        item.screen,
        item.category,
        String(item.price),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [items, searchQuery, selectedCategory])

  // Group filtered items by category for sectioned view
  const groupedItems = useMemo(() => {
    const groups: { category: string; items: StructuredLaptopItem[] }[] = []
    const categoryMap = new Map<string, StructuredLaptopItem[]>()

    filteredItems.forEach(item => {
      const cat = item.category || 'أجهزة عامة'
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, [])
        groups.push({ category: cat, items: categoryMap.get(cat)! })
      }
      categoryMap.get(cat)!.push(item)
    })

    return groups
  }, [filteredItems])

  const formattedDate = priceList?.uploadedAt
    ? new Date(priceList.uploadedAt).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : ''

  return (
    <StoreLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Banner Section matching AlHussein Excel header */}
        <div className="bg-canvas border border-hairline rounded-[24px] p-6 sm:p-8 mb-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 end-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-full text-xs font-bold font-sans">
                <span>قائمة الأسعار المعتمدة</span>
              </div>
              <h1 className="font-sans font-extrabold text-ink text-3xl sm:text-4xl">
                شركة الحسين لابتوب
              </h1>
              <p className="font-body text-ink-muted text-sm sm:text-base max-w-xl">
                أسعار جميع الموديلات المتوفرة لدينا بشفافية تامة — أجهزة استيراد فرز أول مع الضمان الفعلي.
              </p>
            </div>

            {/* Quick Contact & Store Info Badge */}
            <div className="flex flex-col gap-2 bg-surface-1 border border-hairline p-4 rounded-2xl text-xs font-body shrink-0 w-full md:w-auto">
              <div className="flex items-center gap-2 text-ink font-semibold">
                <MapPin className="w-4 h-4 text-brand-primary shrink-0" />
                <span>مصر</span>
              </div>
              <div className="flex items-center gap-2 text-ink-muted">
                <Phone className="w-4 h-4 text-brand-primary shrink-0" />
                <span dir="ltr" className="font-mono text-ink">01060169569 | 01003021210</span>
              </div>
              {formattedDate && (
                <div className="flex items-center gap-2 text-ink-muted border-t border-hairline pt-2 mt-1">
                  <Calendar className="w-4 h-4 text-brand-primary shrink-0" />
                  <span>تاريخ التحديث: <strong className="text-ink">{formattedDate}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          {!loading && !error && items.length > 0 && (
            <div className="mt-8 pt-6 border-t border-hairline flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Search box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن موديل، معالج، أو مواصفات..."
                  className="w-full bg-surface-1 border border-hairline rounded-xl ps-10 pe-4 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-hidden focus:ring-2 focus:ring-brand-primary/50 transition-all font-body"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted hover:text-ink"
                  >
                    مسح
                  </button>
                )}
              </div>

              {/* Category selector pills */}
              {categories.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-body scrollbar-none">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap',
                      selectedCategory === 'all'
                        ? 'bg-brand-primary text-white font-bold shadow-xs'
                        : 'bg-surface-1 text-ink-muted hover:text-ink border border-hairline'
                    )}
                  >
                    الكل ({items.length})
                  </button>
                  {categories.map(cat => {
                    const count = items.filter(it => it.category === cat).length
                    const isSelected = selectedCategory === cat
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap',
                          isSelected
                            ? 'bg-brand-primary text-white font-bold shadow-xs'
                            : 'bg-surface-1 text-ink-muted hover:text-ink border border-hairline'
                        )}
                      >
                        {cat} ({count})
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4 py-8">
            <div className="h-14 bg-surface-1 rounded-2xl animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-16 bg-surface-1 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-canvas border border-hairline rounded-[24px] p-12 text-center my-8">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mx-auto mb-3 text-red-600 dark:text-red-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <p className="font-sans font-bold text-ink text-lg mb-1">
              {error.includes('لا توجد قائمة') ? 'قائمة الأسعار غير متوفرة حالياً' : 'حدث خطأ في تحميل الأسعار'}
            </p>
            <p className="font-body text-sm text-ink-muted max-w-md mx-auto mb-6">
              يرجى التواصل معنا عبر الواتساب أو الاتصال مباشرة للحصول على أحدث الأسعار والمواصفات.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-brand-primary text-white rounded-xl font-body font-semibold text-sm hover:bg-brand-primary/90 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Data Display: React Native Components with Tailwind Theme Tokens */}
        {!loading && !error && items.length > 0 && (
          <div className="space-y-8">
            {groupedItems.map(group => (
              <div
                key={group.category}
                className="bg-canvas border border-hairline rounded-[24px] overflow-hidden shadow-sm"
              >
                {/* Category Header Banner matching AlHussein Excel style */}
                <div className="bg-gradient-to-l from-surface-2 to-surface-1 border-b border-hairline px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-brand-primary" />
                    <h2 className="font-sans font-bold text-ink text-lg sm:text-xl">
                      {group.category}
                    </h2>
                  </div>
                  <span className="text-xs font-body font-semibold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full border border-brand-primary/20">
                    {group.items.length} جهاز
                  </span>
                </div>

                {/* DESKTOP TABLE VIEW (md and up) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-right border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#1E293B] text-white dark:bg-[#162222] dark:text-[#E8F0EF] border-b border-hairline font-sans text-xs">
                        <th className="py-3.5 px-4 w-12 text-center font-bold">#</th>
                        <th className="py-3.5 px-4 font-bold">الموديل</th>
                        <th className="py-3.5 px-4 font-bold">المعالج (CPU)</th>
                        <th className="py-3.5 px-4 font-bold">الذاكرة (RAM)</th>
                        <th className="py-3.5 px-4 font-bold">التخزين (Storage)</th>
                        <th className="py-3.5 px-4 font-bold">الشاشة</th>
                        <th className="py-3.5 px-4 font-bold">كارت الشاشة (GPU)</th>
                        <th className="py-3.5 px-4 font-bold text-left">السعر (EGP)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline font-body">
                      {group.items.map((item, idx) => (
                        <tr
                          key={item.id || idx}
                          className={cn(
                            'transition-colors hover:bg-surface-2/60',
                            idx % 2 === 0 ? 'bg-canvas' : 'bg-surface-1/40'
                          )}
                        >
                          <td className="py-3.5 px-4 text-center font-medium text-ink-muted text-xs">
                            {item.index ?? idx + 1}
                          </td>
                          <td className="py-3.5 px-4 font-sans font-bold text-ink text-sm">
                            {item.name || `${item.brand} ${item.model}`.trim()}
                          </td>
                          <td className="py-3.5 px-4 text-ink font-medium text-xs">
                            {item.cpu || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-ink font-medium text-xs whitespace-nowrap">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-surface-2 text-ink border border-hairline text-xs font-semibold">
                              {item.ram || '-'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-ink font-medium text-xs whitespace-nowrap">
                            {item.storage || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-ink font-medium text-xs whitespace-nowrap">
                            {item.screen || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-ink-muted text-xs">
                            {item.gpu || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-left whitespace-nowrap">
                            <span className="font-sans font-extrabold text-brand-primary text-base font-mono">
                              {Number(item.price || 0).toLocaleString('ar-EG')}
                            </span>
                            <span className="text-xs font-bold text-ink-muted ms-1">ج.م</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARDS VIEW (below md) */}
                <div className="block md:hidden divide-y divide-hairline">
                  {group.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className={cn(
                        'p-5 space-y-3 transition-colors',
                        idx % 2 === 0 ? 'bg-canvas' : 'bg-surface-1/40'
                      )}
                    >
                      {/* Card Header: Index + Name + Price */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-surface-2 text-ink-muted text-xs flex items-center justify-center font-bold shrink-0">
                            {item.index ?? idx + 1}
                          </span>
                          <h3 className="font-sans font-bold text-ink text-base">
                            {item.name || `${item.brand} ${item.model}`.trim()}
                          </h3>
                        </div>
                        <div className="text-left shrink-0">
                          <span className="font-sans font-extrabold text-brand-primary text-lg font-mono">
                            {Number(item.price || 0).toLocaleString('ar-EG')}
                          </span>
                          <span className="text-xs font-bold text-ink-muted ms-1">ج.م</span>
                        </div>
                      </div>

                      {/* Specs Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-body pt-1">
                        <div className="flex items-center gap-2 bg-surface-1 border border-hairline p-2 rounded-xl text-ink">
                          <Cpu className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                          <span className="truncate">{item.cpu || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-surface-1 border border-hairline p-2 rounded-xl text-ink">
                          <HardDrive className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                          <span className="truncate">{item.storage || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-surface-1 border border-hairline p-2 rounded-xl text-ink">
                          <Zap className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                          <span>الرام: <strong className="text-brand-primary">{item.ram || '-'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 bg-surface-1 border border-hairline p-2 rounded-xl text-ink">
                          <Monitor className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                          <span>الشاشة: {item.screen || '-'}</span>
                        </div>
                      </div>

                      {/* GPU line */}
                      {item.gpu && (
                        <div className="text-[11px] text-ink-muted pt-1 flex items-center gap-1.5">
                          <span className="font-semibold text-ink">كارت الشاشة:</span>
                          <span>{item.gpu}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="bg-canvas border border-hairline rounded-[24px] p-12 text-center text-ink-muted">
                <Search className="w-10 h-10 mx-auto text-ink-muted opacity-40 mb-3" />
                <p className="font-sans font-bold text-ink text-base mb-1">لا توجد أجهزة مطابقة لبحثك</p>
                <p className="font-body text-xs">جرب البحث بكلمات أخرى أو اختر &quot;الكل&quot; لعرض جميع الأجهزة.</p>
              </div>
            )}
          </div>
        )}

        {/* Fallback for legacy HTML records if structuredItems is empty */}
        {!loading && !error && items.length === 0 && (priceList?.generatedHtml || priceList?.parsedHtml) && (
          <div className="bg-canvas border border-hairline rounded-[24px] p-6 shadow-sm overflow-hidden">
            <div
              className="font-body text-sm text-ink [&_table]:w-full [&_table]:border-collapse [&_th]:bg-surface-2 [&_th]:p-3 [&_th]:text-right [&_th]:font-semibold [&_td]:border [&_td]:border-hairline [&_td]:p-3 [&_td]:text-right"
              dangerouslySetInnerHTML={{ __html: (priceList.generatedHtml || priceList.parsedHtml)! }}
            />
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 text-center text-xs text-ink-muted font-body leading-relaxed max-w-2xl mx-auto space-y-1">
          <p>الأسعار بالجنيه المصري وتشمل ضريبة القيمة المضافة. يتم الفحص والتسليم بمقر الشركة بمصر الجديدة.</p>
          <p>للحجز والاستفسار عن أي مواصفات إضافية، يرجى التواصل معنا عبر الهاتف أو الواتساب.</p>
        </div>
      </div>
    </StoreLayout>
  )
}
