'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search,
  X,
  Calendar,
  Layers,
  Printer,
  ImageOff,
} from 'lucide-react'
import { api } from '@/lib/api'

interface LiveLaptopItem {
  id: string
  name: string
  price: number
  photo: string | null
  cpu: string
  ram: string
  storage: string
  gpu: string
  screen: string
  stockStatus?: string
}

const GRID_COLS = 'grid-cols-[72px_1.7fr_1.1fr_0.8fr_0.9fr_1.1fr_auto] sm:grid-cols-[88px_1.7fr_1.1fr_0.8fr_0.9fr_1.1fr_auto]'

export default function PriceListView() {
  const [items, setItems] = useState<LiveLaptopItem[]>([])
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  useEffect(() => {
    setLoading(true)
    api
      .get_pricelist_live()
      .then(data => {
        setItems(data?.items || [])
        setUpdatedAt(data?.updatedAt || null)
      })
      .catch(() => {
        setItems([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const filteredItems = useMemo(() => {
    if (!debouncedSearch) return items
    const term = debouncedSearch.toLowerCase()
    return items.filter(item => {
      const text = `${item.name} ${item.cpu || ''} ${item.gpu || ''} ${item.ram || ''} ${item.storage || ''}`.toLowerCase()
      return text.includes(term)
    })
  }, [items, debouncedSearch])

  const clearFilters = () => setSearch('')

  const handlePrint = () => {
    window.print()
  }

  const formattedDate = new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(updatedAt ? new Date(updatedAt) : new Date())

  return (
    <div className="w-full bg-surface-1 min-h-screen py-8 sm:py-12 transition-colors duration-200">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
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

          <button
            onClick={handlePrint}
            className="print-hide inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white font-sans font-bold text-sm hover:brightness-110 transition-all shadow-sm shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>تحميل / طباعة PDF</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="print-hide bg-canvas p-4 sm:p-5 rounded-2xl border border-hairline shadow-sm mb-8">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث بالاسم، المعالج (i7, Ryzen)، كارت الشاشة..."
                className="w-full h-11 pr-9 pl-4 rounded-xl bg-surface-1 border border-hairline text-sm text-ink placeholder-ink-muted focus:border-brand-primary focus:bg-canvas outline-none transition-all"
              />
              <Search className="w-4 h-4 text-ink-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {debouncedSearch && (
              <button
                onClick={clearFilters}
                className="h-11 px-4 rounded-xl border border-hairline text-xs sm:text-sm font-semibold text-ink-muted hover:text-ink hover:bg-surface-1 flex items-center gap-1.5 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>مسح</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-16 text-center text-ink-muted font-body">
            جاري تحميل قائمة الأسعار...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center bg-canvas rounded-2xl border border-hairline shadow-sm space-y-3">
            <h3 className="font-bold text-ink text-base">
              لا توجد قائمة أسعار منشورة حالياً
            </h3>
            <p className="text-xs text-ink-muted">
              سيتم عرض الأجهزة هنا تلقائياً بمجرد إضافتها كمنتجات ظاهرة في قسم اللابتوبات.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-canvas rounded-2xl border border-hairline shadow-sm space-y-3">
            <h3 className="font-bold text-ink text-base">
              لا توجد أجهزة مطابقة للبحث
            </h3>
            <p className="text-xs text-ink-muted">
              جرّب كلمة بحث أخرى.
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:brightness-110 transition-colors"
            >
              إعادة ضبط البحث
            </button>
          </div>
        ) : (
          <div className="bg-canvas rounded-2xl border border-hairline shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                {/* Header row */}
                <div
                  className={`grid ${GRID_COLS} items-center bg-inverse-canvas text-white font-sans font-bold select-none`}
                  style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                >
                  <div className="py-4 px-4 border-b border-white/15 text-center text-sm">الصورة</div>
                  <div className="py-4 px-4 border-b border-white/15 text-base">اسم الجهاز</div>
                  <div className="py-4 px-4 border-b border-white/15 text-base">المعالج</div>
                  <div className="py-4 px-4 border-b border-white/15 text-base">الرام</div>
                  <div className="py-4 px-4 border-b border-white/15 text-base">التخزين</div>
                  <div className="py-4 px-4 border-b border-white/15 text-base">كارت الشاشة</div>
                  <div className="py-4 px-4 border-b border-white/15 text-base text-center">السعر (ج.م)</div>
                </div>

                {/* Rows */}
                {filteredItems.map((item, idx) => {
                  const isEven = idx % 2 === 0
                  return (
                    <Link
                      key={item.id}
                      href={`/laptops/${item.id}`}
                      className={`print-table-row grid ${GRID_COLS} items-center border-b border-hairline transition-colors hover:bg-brand-primary/5 ${
                        isEven ? 'bg-canvas' : 'bg-surface-1'
                      }`}
                      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                    >
                      {/* Photo */}
                      <div className="p-3 flex items-center justify-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-hairline bg-surface-2 shrink-0 flex items-center justify-center">
                          {item.photo ? (
                            <Image
                              src={item.photo}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageOff className="w-6 h-6 text-ink-muted" />
                          )}
                        </div>
                      </div>

                      {/* Name */}
                      <div className="py-3 px-3 font-sans font-bold text-ink text-base leading-snug">
                        {item.name}
                      </div>

                      {/* CPU */}
                      <div className="py-3 px-3 text-ink-muted text-sm">
                        <span dir="ltr">{item.cpu || '—'}</span>
                      </div>

                      {/* RAM */}
                      <div className="py-3 px-3 text-ink-muted text-sm">
                        <span dir="ltr">{item.ram || '—'}</span>
                      </div>

                      {/* Storage */}
                      <div className="py-3 px-3 text-ink-muted text-sm">
                        <span dir="ltr">{item.storage || '—'}</span>
                      </div>

                      {/* GPU */}
                      <div className="py-3 px-3 text-ink-muted text-sm">
                        <span dir="ltr">{item.gpu || '—'}</span>
                      </div>

                      {/* Price */}
                      <div
                        className="py-3 px-4 text-center bg-brand-primary/10 text-brand-primary font-sans font-extrabold text-base self-stretch flex items-center justify-center whitespace-nowrap"
                        style={{
                          WebkitPrintColorAdjust: 'exact',
                          printColorAdjust: 'exact',
                        }}
                      >
                        {item.price.toLocaleString('ar-EG')} ج.م
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
