'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search,
  X,
  Calendar,
  Layers,
  Download,
  ImageOff,
  Loader2,
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

/** Fetches an image and converts it to a base64 data URL so html2canvas can render it
 *  without hitting canvas-tainting / CORS issues, and so the PDF never shows a broken image. */
async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export default function PriceListView() {
  const [items, setItems] = useState<LiveLaptopItem[]>([])
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const exportRef = useRef<HTMLDivElement>(null)

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

  const formattedDate = new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(updatedAt ? new Date(updatedAt) : new Date())

  const handleDownloadPdf = async () => {
    if (filteredItems.length === 0 || generatingPdf) return
    setGeneratingPdf(true)
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas-pro'),
      ])

      // Pre-fetch every photo as a data URL so the offscreen render never
      // shows a broken/placeholder image and never taints the canvas.
      const photoDataUrls = await Promise.all(
        filteredItems.map(item => (item.photo ? toDataUrl(item.photo) : Promise.resolve(null)))
      )

      const node = exportRef.current
      if (!node) return

      // Build the plain, self-contained export markup (no Tailwind CSS vars,
      // fixed pixel sizing) so the rasterized PDF always looks right
      // regardless of the visitor's theme or browser.
      node.innerHTML = ''
      node.style.direction = 'rtl'
      node.style.fontFamily = "'Cairo', 'Tajawal', Arial, sans-serif"
      node.style.width = '1000px'
      node.style.background = '#ffffff'
      node.style.color = '#0f172a'
      node.style.padding = '32px'

      const header = document.createElement('div')
      header.style.display = 'flex'
      header.style.justifyContent = 'space-between'
      header.style.alignItems = 'flex-start'
      header.style.borderBottom = '2px solid #e2e8f0'
      header.style.paddingBottom = '20px'
      header.style.marginBottom = '20px'
      header.innerHTML = `
        <div>
          <div style="display:inline-block;background:#0f766e1a;color:#0f766e;font-weight:700;font-size:12px;padding:4px 12px;border-radius:999px;margin-bottom:8px;">قائمة الأسعار المحدثة</div>
          <div style="font-size:28px;font-weight:800;color:#0f172a;">الحسين للاب توب</div>
          <div style="font-size:13px;color:#64748b;margin-top:6px;">تاريخ التحديث: ${formattedDate}</div>
        </div>
      `
      node.appendChild(header)

      const table = document.createElement('div')
      table.style.borderRadius = '16px'
      table.style.overflow = 'hidden'
      table.style.border = '1px solid #e2e8f0'
      node.appendChild(table)

      const colTemplate = '76px 2.1fr 1.3fr 0.9fr 1fr 1.3fr 1fr'

      const headerRow = document.createElement('div')
      headerRow.style.display = 'grid'
      headerRow.style.gridTemplateColumns = colTemplate
      headerRow.style.alignItems = 'center'
      headerRow.style.background = '#0f172a'
      headerRow.style.color = '#ffffff'
      headerRow.style.fontWeight = '700'
      headerRow.style.fontSize = '14px'
      ;['الصورة', 'اسم الجهاز', 'المعالج', 'الرام', 'التخزين', 'كارت الشاشة', 'السعر (ج.م)'].forEach((label, i) => {
        const cell = document.createElement('div')
        cell.textContent = label
        cell.style.padding = '14px 12px'
        cell.style.textAlign = i === 0 || i === 6 ? 'center' : 'right'
        headerRow.appendChild(cell)
      })
      table.appendChild(headerRow)

      filteredItems.forEach((item, idx) => {
        const row = document.createElement('div')
        row.style.display = 'grid'
        row.style.gridTemplateColumns = colTemplate
        row.style.alignItems = 'center'
        row.style.background = idx % 2 === 0 ? '#ffffff' : '#f8fafc'
        row.style.borderTop = '1px solid #e2e8f0'

        const photoCell = document.createElement('div')
        photoCell.style.display = 'flex'
        photoCell.style.justifyContent = 'center'
        photoCell.style.padding = '10px'
        const thumbBox = document.createElement('div')
        thumbBox.style.width = '56px'
        thumbBox.style.height = '56px'
        thumbBox.style.borderRadius = '10px'
        thumbBox.style.overflow = 'hidden'
        thumbBox.style.border = '1px solid #e2e8f0'
        thumbBox.style.background = '#f1f5f9'
        thumbBox.style.display = 'flex'
        thumbBox.style.alignItems = 'center'
        thumbBox.style.justifyContent = 'center'
        const dataUrl = photoDataUrls[idx]
        if (dataUrl) {
          const img = document.createElement('img')
          img.src = dataUrl
          img.style.width = '100%'
          img.style.height = '100%'
          img.style.objectFit = 'cover'
          thumbBox.appendChild(img)
        }
        photoCell.appendChild(thumbBox)
        row.appendChild(photoCell)

        const nameCell = document.createElement('div')
        nameCell.textContent = item.name
        nameCell.style.padding = '12px'
        nameCell.style.fontWeight = '700'
        nameCell.style.fontSize = '15px'
        nameCell.style.color = '#0f172a'
        row.appendChild(nameCell)

        const makeTextCell = (text: string) => {
          const cell = document.createElement('div')
          cell.textContent = text || '—'
          cell.style.padding = '12px'
          cell.style.fontSize = '13px'
          cell.style.color = '#475569'
          cell.dir = 'ltr'
          cell.style.textAlign = 'right'
          return cell
        }
        row.appendChild(makeTextCell(item.cpu))
        row.appendChild(makeTextCell(item.ram))
        row.appendChild(makeTextCell(item.storage))
        row.appendChild(makeTextCell(item.gpu))

        const priceCell = document.createElement('div')
        priceCell.textContent = `${item.price.toLocaleString('ar-EG')} ج.م`
        priceCell.style.padding = '12px'
        priceCell.style.fontWeight = '800'
        priceCell.style.fontSize = '15px'
        priceCell.style.color = '#0f766e'
        priceCell.style.background = '#0f766e14'
        priceCell.style.textAlign = 'center'
        priceCell.style.alignSelf = 'stretch'
        priceCell.style.display = 'flex'
        priceCell.style.alignItems = 'center'
        priceCell.style.justifyContent = 'center'
        row.appendChild(priceCell)

        table.appendChild(row)
      })

      // Render fully off-screen but laid out (not display:none) so the browser
      // actually computes layout/paint for html2canvas to capture.
      node.style.position = 'fixed'
      node.style.top = '0'
      node.style.left = '-99999px'
      node.style.zIndex = '-1'

      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`قائمة-اسعار-الحسين-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('حدث خطأ أثناء إنشاء ملف PDF، برجاء المحاولة مرة أخرى.')
    } finally {
      if (exportRef.current) {
        exportRef.current.innerHTML = ''
        exportRef.current.removeAttribute('style')
      }
      setGeneratingPdf(false)
    }
  }

  return (
    <div className="w-full bg-surface-1 min-h-screen py-8 sm:py-12 transition-colors duration-200">
      {/* Offscreen container used only to render the exportable PDF markup */}
      <div ref={exportRef} aria-hidden="true" />

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
            onClick={handleDownloadPdf}
            disabled={generatingPdf || filteredItems.length === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white font-sans font-bold text-sm hover:brightness-110 transition-all shadow-sm shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generatingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري التجهيز...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>تحميل PDF</span>
              </>
            )}
          </button>
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
                      className={`grid ${GRID_COLS} items-center border-b border-hairline transition-colors hover:bg-brand-primary/5 ${
                        isEven ? 'bg-canvas' : 'bg-surface-1'
                      }`}
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
                      <div className="py-3 px-4 text-center bg-brand-primary/10 text-brand-primary font-sans font-extrabold text-base self-stretch flex items-center justify-center whitespace-nowrap">
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
