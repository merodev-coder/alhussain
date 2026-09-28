'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, X, Calendar, Layers, Download, ImageOff } from 'lucide-react'
import { api } from '@/lib/api'
import { splitCpu, splitGpu, formatPrice } from '@/lib/pricelist-format'

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

// Left → right: photo · name · CPU · RAM · storage · GPU · price
const GRID_COLS =
  'grid-cols-[170px_1.6fr_1.2fr_0.6fr_0.9fr_1.4fr_0.9fr] sm:grid-cols-[190px_1.6fr_1.2fr_0.6fr_0.9fr_1.4fr_0.9fr]'

export default function PriceListView() {
  const [items, setItems] = useState<LiveLaptopItem[]>([])
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfReady, setPdfReady] = useState<boolean | null>(null)
  const [pdfDate, setPdfDate] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search.trim()), 300)
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
      .catch(() => setItems([]))
      .finally(() => setLoading(false))

    // Is there a published (pre-generated) PDF customers can download?
    api
      .get_pricelist_pdf_meta()
      .then(meta => {
        setPdfReady(!!meta?.exists)
        setPdfDate(meta?.updatedAt || null)
      })
      .catch(() => setPdfReady(false))
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

  const dateFormatter = new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
  const formattedDate = dateFormatter.format(updatedAt ? new Date(updatedAt) : new Date())

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

          {/* Instant download of the pre-generated PDF (no generation in the browser) */}
          {pdfReady ? (
            <a
              href={api.pricelist_pdf_url()}
              download
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white font-sans font-bold text-sm hover:brightness-110 transition-all shadow-sm shrink-0"
              title={pdfDate ? `آخر تحديث للملف: ${dateFormatter.format(new Date(pdfDate))}` : undefined}
            >
              <Download className="w-4 h-4" />
              <span>تحميل PDF</span>
            </a>
          ) : (
            <button
              disabled
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white font-sans font-bold text-sm shadow-sm shrink-0 opacity-60 cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>{pdfReady === null ? 'تحميل PDF' : 'ملف PDF غير متاح حالياً'}</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="bg-canvas p-4 sm:p-5 rounded-2xl border border-hairline shadow-sm mb-8">
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
          <div className="p-16 text-center text-ink-muted font-body">جاري تحميل قائمة الأسعار...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center bg-canvas rounded-2xl border border-hairline shadow-sm space-y-3">
            <h3 className="font-bold text-ink text-base">لا توجد قائمة أسعار منشورة حالياً</h3>
            <p className="text-xs text-ink-muted">
              سيتم عرض الأجهزة هنا تلقائياً بمجرد إضافتها كمنتجات ظاهرة في المتجر.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-canvas rounded-2xl border border-hairline shadow-sm space-y-3">
            <h3 className="font-bold text-ink text-base">لا توجد أجهزة مطابقة للبحث</h3>
            <p className="text-xs text-ink-muted">جرّب كلمة بحث أخرى.</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:brightness-110 transition-colors"
            >
              إعادة ضبط البحث
            </button>
          </div>
        ) : (
          <div className="bg-canvas rounded-2xl border border-hairline shadow-sm overflow-hidden">
            <div className="overflow-x-auto" dir="ltr">
              <div className="min-w-[860px]">
                {/* Header row */}
                <div
                  className={`grid ${GRID_COLS} items-center bg-inverse-canvas text-white font-sans font-bold select-none`}
                >
                  <div className="py-4 px-4 text-center text-sm" dir="rtl">الصورة</div>
                  <div className="py-4 px-3 text-sm text-right" dir="rtl">اسم الجهاز</div>
                  <div className="py-4 px-3 text-sm text-right" dir="rtl">المعالج</div>
                  <div className="py-4 px-3 text-sm text-right" dir="rtl">الرام</div>
                  <div className="py-4 px-3 text-sm text-right" dir="rtl">التخزين</div>
                  <div className="py-4 px-3 text-sm text-right" dir="rtl">كارت الشاشة</div>
                  <div className="py-4 px-3 text-sm text-center" dir="rtl">السعر (ج.م)</div>
                </div>

                {/* Rows */}
                {filteredItems.map((item, idx) => {
                  const cpu = splitCpu(item.cpu)
                  const gpu = splitGpu(item.gpu)
                  return (
                    <Link
                      key={item.id}
                      href={`/laptops/${item.id}`}
                      className={`grid ${GRID_COLS} items-center border-b border-hairline transition-colors hover:bg-brand-primary/5 ${
                        idx % 2 === 0 ? 'bg-canvas' : 'bg-surface-1'
                      }`}
                    >
                      {/* Photo: wider than tall, with margin on both sides */}
                      <div className="py-2.5 px-4 flex items-center justify-center">
                        <div className="w-full max-w-[150px] aspect-[5/3] rounded-lg overflow-hidden border border-hairline bg-white flex items-center justify-center">
                          {item.photo ? (
                            <Image
                              src={item.photo}
                              alt={item.name}
                              width={300}
                              height={180}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <ImageOff className="w-7 h-7 text-ink-muted" />
                          )}
                        </div>
                      </div>

                      {/* Name */}
                      <div className="py-3 px-3 font-sans font-bold text-ink text-sm sm:text-base leading-snug text-left">
                        {item.name}
                      </div>

                      {/* CPU + Arabic generation */}
                      <div className="py-3 px-3 text-sm text-left">
                        <div className="text-ink">{cpu.name || '—'}</div>
                        {cpu.generation && (
                          <div dir="rtl" className="text-ink-muted text-xs mt-0.5 text-right">
                            {cpu.generation}
                          </div>
                        )}
                      </div>

                      {/* RAM */}
                      <div className="py-3 px-3 text-ink text-sm text-left">{item.ram || '—'}</div>

                      {/* Storage */}
                      <div className="py-3 px-3 text-ink text-sm text-left">{item.storage || '—'}</div>

                      {/* GPU name, VRAM underneath */}
                      <div className="py-3 px-3 text-sm text-left">
                        <div className="text-ink">{gpu.name || '—'}</div>
                        {gpu.vram && <div className="text-ink-muted text-xs mt-0.5">{gpu.vram}</div>}
                      </div>

                      {/* Price (English digits) */}
                      <div className="py-3 px-3 text-center bg-brand-primary/10 text-brand-primary font-sans font-extrabold text-base self-stretch flex items-center justify-center whitespace-nowrap">
                        {formatPrice(item.price)}
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
