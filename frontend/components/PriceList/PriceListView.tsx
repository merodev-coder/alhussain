'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  ChevronDown,
  ChevronUp,
  X,
  SlidersHorizontal,
  Calendar,
  Layers,
  ArrowUpDown,
  Filter,
} from 'lucide-react'
import { api } from '@/lib/api'

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

interface PricelistData {
  id?: string
  sourceFileName: string
  rawExcelFileUrl?: string
  structuredItems?: StructuredLaptopItem[]
  generatedHtml?: string
  parsedHtml?: string
  uploadedAt: string
  published: boolean
}

export default function PriceListView() {
  const [pricelist, setPricelist] = useState<PricelistData | null>(null)
  const [loading, setLoading] = useState(true)

  // Filter states
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')

  // Collapsed groups state
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  // Fetch AI-generated pricelist
  useEffect(() => {
    setLoading(true)
    api
      .get_pricelist()
      .then(data => {
        setPricelist(data)
      })
      .catch(() => {
        setPricelist(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // Filtered Pricelist Items
  const filteredItems = useMemo(() => {
    if (!pricelist?.structuredItems) return []
    
    return pricelist.structuredItems.filter((item: StructuredLaptopItem) => {
      // 1. Text Search (Model, CPU, GPU, Name, Brand)
      if (debouncedSearch) {
        const term = debouncedSearch.toLowerCase()
        const text = `${item.name} ${item.model || ''} ${item.brand || ''} ${item.cpu || ''} ${item.gpu || ''}`.toLowerCase()
        if (!text.includes(term)) return false
      }

      // 2. Category Filter
      if (categoryFilter !== 'all') {
        const cat = item.category || 'other'
        if (cat !== categoryFilter) return false
      }

      // 3. Price Range
      const min = minPrice ? parseFloat(minPrice) : null
      const max = maxPrice ? parseFloat(maxPrice) : null
      if (min !== null && !isNaN(min) && item.price < min) return false
      if (max !== null && !isNaN(max) && item.price > max) return false

      return true
    })
  }, [pricelist, debouncedSearch, categoryFilter, minPrice, maxPrice])

  // Group filtered items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, StructuredLaptopItem[]> = {}

    // Grouping
    for (const item of filteredItems) {
      const section = item.category || 'other'
      if (!groups[section]) {
        groups[section] = []
      }
      groups[section].push(item)
    }

    return groups
  }, [filteredItems])

  // Get unique categories from pricelist for filter dropdown
  const availableCategories = useMemo(() => {
    if (!pricelist?.structuredItems) return []
    const categories = new Set<string>()
    pricelist.structuredItems.forEach(item => {
      if (item.category) {
        categories.add(item.category)
      }
    })
    return Array.from(categories).sort()
  }, [pricelist])

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const clearFilters = () => {
    setSearch('')
    setCategoryFilter('all')
    setMinPrice('')
    setMaxPrice('')
  }

  const hasActiveFilters = Boolean(
    debouncedSearch || categoryFilter !== 'all' || minPrice || maxPrice
  )

  // Current Arabic date formatted
  const formattedDate = new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date())

  return (
    <div className="w-full bg-surface-1 min-h-screen py-8 sm:py-12 transition-colors duration-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header (Shop Name + Date + Print Button) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-hairline">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>قائمة الأسعار المحدثة</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-ink tracking-tight">
              الحسين للاب توب
            </h1>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-ink-muted mt-1">
              <Calendar className="w-4 h-4 text-ink-muted" />
              <span>تاريخ التحديث: {formattedDate}</span>
            </div>
          </div>

        </div>

        {/* Search & Filter Bar */}
        <div className="print-hide bg-canvas p-4 sm:p-5 rounded-2xl border border-hairline shadow-sm mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted flex items-center gap-1.5 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5" />
              <span>فلاتر البحث السريع</span>
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-brand-primary hover:underline flex items-center gap-1 font-semibold"
              >
                <X className="w-3 h-3" />
                <span>مسح الفلاتر</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Text Search */}
            <div className="sm:col-span-5 relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث بالموديل، المعالج (i7, Ryzen)، كارت الشاشة..."
                className="w-full h-10 pr-9 pl-4 rounded-xl bg-surface-1 border border-hairline text-xs sm:text-sm text-ink placeholder-ink-muted focus:border-brand-primary focus:bg-canvas outline-none transition-all"
              />
              <Search className="w-4 h-4 text-ink-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Category Dropdown */}
            <div className="sm:col-span-3">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface-1 border border-hairline text-xs sm:text-sm text-ink focus:border-brand-primary outline-none transition-all"
              >
                <option value="all">جميع الأقسام</option>
                {availableCategories.map((cat: string) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Min Price */}
            <div className="sm:col-span-2">
              <input
                type="number"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                placeholder="السعر من (ج.م)"
                className="w-full h-10 px-3 rounded-xl bg-surface-1 border border-hairline text-xs sm:text-sm text-ink placeholder-ink-muted focus:border-brand-primary outline-none transition-all"
              />
            </div>

            {/* Max Price */}
            <div className="sm:col-span-2">
              <input
                type="number"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                placeholder="السعر إلى (ج.م)"
                className="w-full h-10 px-3 rounded-xl bg-surface-1 border border-hairline text-xs sm:text-sm text-ink placeholder-ink-muted focus:border-brand-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Content: Grouped Tables */}
        {loading ? (
          <div className="p-16 text-center text-ink-muted font-body">
            جاري تحميل قائمة الأسعار...
          </div>
        ) : !pricelist || !pricelist.structuredItems || pricelist.structuredItems.length === 0 ? (
          <div className="p-12 text-center bg-canvas rounded-2xl border border-hairline shadow-sm space-y-3">
            <h3 className="font-bold text-ink text-base">
              لا توجد قائمة أسعار منشورة حالياً
            </h3>
            <p className="text-xs text-ink-muted">
              سيتم تحديث قائمة الأسعار قريباً من لوحة التحكم.
            </p>
          </div>
        ) : Object.keys(groupedItems).length === 0 ? (
          <div className="p-12 text-center bg-canvas rounded-2xl border border-hairline shadow-sm space-y-3">
            <h3 className="font-bold text-ink text-base">
              لا توجد منتجات مطابقة لخيارات البحث
            </h3>
            <p className="text-xs text-ink-muted">
              جرّب تقليل الفلاتر أو البحث بكلمات أخرى.
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:brightness-110 transition-colors"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([key, items]) => {
              const isCollapsed = collapsedGroups[key]
              const title = key === 'other' ? 'أجهزة ومنتجات أخرى' : key

              return (
                <div
                  key={key}
                  className="bg-canvas rounded-2xl border border-hairline shadow-sm overflow-hidden"
                >
                  {/* Collapsible Header */}
                  <button
                    onClick={() => toggleGroup(key)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between bg-surface-1 hover:bg-surface-2 transition-colors cursor-pointer border-b border-hairline"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
                      <h3 className="font-sans font-bold text-sm sm:text-base text-ink">
                        {title}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-2 text-[11px] font-bold text-ink-muted">
                        {items.length} جهاز
                      </span>
                    </div>

                    <div className="print-hide text-ink-muted">
                      {isCollapsed ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronUp className="w-5 h-5" />
                      )}
                    </div>
                  </button>

                  {/* Table Section */}
                  {(!isCollapsed || typeof window === 'undefined') && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr
                            className="bg-inverse-canvas text-white font-sans font-bold select-none"
                            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                          >
                            <th className="py-3 px-3 w-10 text-center border-b border-white/15">#</th>
                            <th className="py-3 px-3 border-b border-white/15 min-w-[150px]">الموديل</th>
                            <th className="py-3 px-3 border-b border-white/15 min-w-[120px]">المعالج</th>
                            <th className="py-3 px-3 border-b border-white/15 min-w-[90px]">الرام</th>
                            <th className="py-3 px-3 border-b border-white/15 min-w-[90px]">التخزين</th>
                            <th className="py-3 px-3 border-b border-white/15 min-w-[90px]">الشاشة</th>
                            <th className="py-3 px-3 border-b border-white/15 min-w-[130px]">كارت الشاشة (GPU)</th>
                            <th className="py-3 px-3 border-b border-white/15 min-w-[110px] text-center">السعر (ج.م)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item: StructuredLaptopItem, idx) => {
                            const isEven = idx % 2 === 0
                            return (
                              <tr
                                key={item.id || item.index}
                                className={`print-table-row border-b border-hairline transition-colors hover:bg-brand-primary/5 min-h-[36px] ${
                                  isEven
                                    ? 'bg-canvas'
                                    : 'bg-surface-1'
                                }`}
                                style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                              >
                                {/* # */}
                                <td className="py-2.5 px-3 text-center text-ink-muted font-mono text-xs">
                                  {item.index || idx + 1}
                                </td>

                                {/* Model / Name */}
                                <td className="py-2.5 px-3 font-sans font-bold text-ink">
                                  {item.name}
                                  {item.flagged && (
                                    <span className="mr-2 px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-medium">
                                      {item.flagReason || 'تحتاج مراجعة'}
                                    </span>
                                  )}
                                </td>

                                {/* Processor */}
                                <td className="py-2.5 px-3 text-ink-muted">
                                  <span dir="ltr">{item.cpu || '—'}</span>
                                </td>

                                {/* RAM */}
                                <td className="py-2.5 px-3 text-ink-muted">
                                  <span dir="ltr">{item.ram || '—'}</span>
                                </td>

                                {/* Storage */}
                                <td className="py-2.5 px-3 text-ink-muted">
                                  <span dir="ltr">{item.storage || '—'}</span>
                                </td>

                                {/* Screen */}
                                <td className="py-2.5 px-3 text-ink-muted">
                                  <span dir="ltr">{item.screen || '—'}</span>
                                </td>

                                {/* GPU */}
                                <td className="py-2.5 px-3 text-ink-muted">
                                  <span dir="ltr">{item.gpu || '—'}</span>
                                </td>

                                {/* Price Column: Brand-teal tint bg, brand-teal bold text */}
                                <td
                                  className="py-2.5 px-3 text-center bg-brand-primary/10 text-brand-primary font-sans font-extrabold"
                                  style={{
                                    WebkitPrintColorAdjust: 'exact',
                                    printColorAdjust: 'exact',
                                  }}
                                >
                                  {item.price.toLocaleString('ar-EG')} ج.م
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
