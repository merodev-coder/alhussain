'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import {
  RefreshCw,
  Search,
  Pencil,
  ImageOff,
  Info,
  FileDown,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import api from '@/lib/api'
import { clientLogger } from '@/lib/client-logger'
import { buildPricelistPdf } from '@/lib/pricelist-pdf'
import { splitCpu, splitGpu, formatPrice } from '@/lib/pricelist-format'

interface PdfMeta {
  exists: boolean
  fileName?: string
  sizeBytes?: number
  itemCount?: number
  signature?: string
  updatedAt?: string
}

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

export default function PricelistTab({ onGoToProducts }: { onGoToProducts?: () => void }) {
  const [items, setItems] = useState<LiveLaptopItem[]>([])
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [signature, setSignature] = useState('')
  const [pdfMeta, setPdfMeta] = useState<PdfMeta | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)

  const fetchPdfMeta = async () => {
    try {
      setPdfMeta(await api.get_pricelist_pdf_meta())
    } catch (err) {
      clientLogger.error('Failed to load pricelist PDF status:', err)
    }
  }

  const fetchList = async () => {
    setLoading(true)
    try {
      const [data] = await Promise.all([api.get_pricelist_live(), fetchPdfMeta()])
      setItems(data?.items || [])
      setUpdatedAt(data?.updatedAt || null)
      setSignature(data?.signature || '')
    } catch (err) {
      clientLogger.error('Failed to load live pricelist:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter(item => {
      const text = `${item.name} ${item.cpu || ''} ${item.gpu || ''} ${item.ram || ''} ${item.storage || ''}`.toLowerCase()
      return text.includes(term)
    })
  }, [items, search])

  const hasUnpublishedChanges =
    !!pdfMeta?.exists && !!signature && !!pdfMeta.signature && pdfMeta.signature !== signature

  const handlePublish = async () => {
    if (items.length === 0 || publishing) return
    setPublishing(true)
    setPublishError(null)
    setProgress({ done: 0, total: items.length })
    try {
      // Re-read the catalog right before building so the PDF matches what is
      // in the database now, not what was loaded when the tab was opened.
      const fresh = await api.get_pricelist_live()
      const freshItems = fresh?.items || []
      if (freshItems.length === 0) throw new Error('لا توجد منتجات ظاهرة لنشرها')
      setProgress({ done: 0, total: freshItems.length })

      const blob = await buildPricelistPdf(freshItems, new Date(), (done, total) =>
        setProgress({ done, total })
      )
      await api.publish_pricelist_pdf(blob, freshItems.length, fresh?.signature || '')

      setItems(freshItems)
      setSignature(fresh?.signature || '')
      setUpdatedAt(fresh?.updatedAt || null)
      await fetchPdfMeta()
    } catch (err) {
      clientLogger.error('Failed to publish pricelist PDF:', err)
      setPublishError(err instanceof Error ? err.message : 'حدث خطأ أثناء نشر القائمة')
    } finally {
      setPublishing(false)
      setProgress(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-sans font-bold text-ink text-2xl mb-2">قائمة الأسعار</h2>
        <p className="font-body text-sm text-ink-muted leading-relaxed">
          هذه القائمة تُبنى تلقائياً من كل منتج <strong>ظاهر</strong> في المتجر (مفعّل من تاب المنتجات).
          لتعديل أو إضافة أو إخفاء جهاز، استخدم تاب <strong>المنتجات</strong> — أي تغيير هناك يظهر هنا وفي صفحة قائمة الأسعار العامة فوراً.
          بعد الانتهاء من التعديلات اضغط <strong>نشر قائمة الأسعار</strong> لإنشاء ملف PDF جاهز للتحميل الفوري للعملاء.
        </p>
      </div>

      {/* Publish status */}
      <div
        className={`flex flex-wrap items-center gap-3 p-4 rounded-xl border ${
          hasUnpublishedChanges || (pdfMeta && !pdfMeta.exists)
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-emerald-500/10 border-emerald-500/30'
        }`}
      >
        {hasUnpublishedChanges || (pdfMeta && !pdfMeta.exists) ? (
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
        ) : (
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
        )}
        <div className="flex-1 min-w-[220px] font-body text-sm text-ink leading-relaxed">
          {!pdfMeta ? (
            'جاري التحقق من حالة الملف...'
          ) : !pdfMeta.exists ? (
            <>لم يتم نشر ملف PDF بعد — العملاء لن يتمكنوا من التحميل حتى تضغط على <strong>نشر قائمة الأسعار</strong>.</>
          ) : hasUnpublishedChanges ? (
            <>
              <strong>يوجد تعديلات لم يتم نشرها.</strong> الملف الحالي منشور بتاريخ{' '}
              {pdfMeta.updatedAt ? new Date(pdfMeta.updatedAt).toLocaleString('ar-EG') : '-'} ولا يعكس آخر التغييرات في المنتجات.
            </>
          ) : (
            <>
              الملف المنشور محدّث ({pdfMeta.itemCount} جهاز
              {pdfMeta.sizeBytes ? ` · ${(pdfMeta.sizeBytes / 1024 / 1024).toFixed(2)} MB` : ''}) — آخر نشر{' '}
              {pdfMeta.updatedAt ? new Date(pdfMeta.updatedAt).toLocaleString('ar-EG') : '-'}
            </>
          )}
          {publishError && <div className="mt-1 text-red-600 font-semibold">{publishError}</div>}
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl text-ink">
        <Info className="w-5 h-5 shrink-0 mt-0.5 text-brand-primary" />
        <div className="flex-1 font-body text-sm leading-relaxed">
          الصورة المعروضة لكل جهاز هنا هي <strong>الصورة الأساسية</strong> المحددة له في تاب المنتجات (أول صورة في ترتيب صور الجهاز).
          لتغييرها، افتح الجهاز من تاب المنتجات واستخدم زر "اجعلها الصورة الأساسية".
        </div>
        {onGoToProducts && (
          <button
            onClick={onGoToProducts}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white hover:bg-brand-primary/90 rounded-lg text-xs font-semibold shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            الذهاب لتاب المنتجات
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو المعالج أو كارت الشاشة..."
            className="w-full h-10 pr-9 pl-4 rounded-xl bg-canvas border border-hairline text-sm text-ink placeholder-ink-muted focus:border-brand-primary outline-none transition-all"
          />
          <Search className="w-4 h-4 text-ink-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <button
          onClick={fetchList}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-surface-1 text-ink hover:bg-surface-2 border border-hairline rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>

        <button
          onClick={() => window.open('/pricelist', '_blank', 'noopener,noreferrer')}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-surface-1 text-ink hover:bg-surface-2 border border-hairline rounded-xl text-sm font-medium transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          فتح الصفحة العامة
        </button>

        <button
          onClick={handlePublish}
          disabled={publishing || loading || items.length === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-primary text-white hover:bg-brand-primary/90 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {publishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {progress ? `جاري إنشاء الملف... ${progress.done}/${progress.total}` : 'جاري التجهيز...'}
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4" />
              نشر قائمة الأسعار (إنشاء PDF)
            </>
          )}
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-8 text-center bg-canvas border border-hairline rounded-[20px]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-primary mb-2" />
          <p className="font-body text-sm text-ink-muted">جاري تحميل قائمة الأسعار...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-canvas border border-hairline rounded-[20px] p-8 text-center text-ink-muted">
          <p className="font-body text-sm">
            لا توجد منتجات ظاهرة حالياً. فعّل ظهور جهاز واحد على الأقل من تاب المنتجات ليظهر هنا.
          </p>
        </div>
      ) : (
        <div className="bg-canvas border border-hairline rounded-[20px] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
            <h3 className="font-sans font-bold text-ink text-lg">
              الأجهزة الظاهرة في القائمة ({filteredItems.length})
            </h3>
            {updatedAt && (
              <p className="font-body text-xs text-ink-muted">
                آخر تحديث: {new Date(updatedAt).toLocaleString('ar-EG')}
              </p>
            )}
          </div>
          <div className="overflow-x-auto" dir="ltr">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-surface-2 text-ink font-semibold text-xs border-b border-hairline">
                  <th className="p-3 w-32 text-center">الصورة</th>
                  <th className="p-3 min-w-[160px] text-right">اسم الجهاز</th>
                  <th className="p-3 min-w-[140px] text-right">المعالج</th>
                  <th className="p-3 min-w-[70px] text-right">الرام</th>
                  <th className="p-3 min-w-[100px] text-right">التخزين</th>
                  <th className="p-3 min-w-[160px] text-right">كارت الشاشة</th>
                  <th className="p-3 min-w-[100px] text-center">السعر (ج.م)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline font-body">
                {filteredItems.map(item => {
                  const cpu = splitCpu(item.cpu)
                  const gpu = splitGpu(item.gpu)
                  return (
                    <tr key={item.id} className="hover:bg-surface-1/70 transition-colors">
                      <td className="p-3">
                        <div className="w-24 h-14 mx-4 rounded-lg overflow-hidden border border-hairline bg-white flex items-center justify-center">
                          {item.photo ? (
                            <Image src={item.photo} alt={item.name} width={96} height={56} className="w-full h-full object-contain" />
                          ) : (
                            <ImageOff className="w-5 h-5 text-ink-muted" />
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-ink">{item.name}</td>
                      <td className="p-3 text-ink text-xs">
                        <div>{cpu.name || '-'}</div>
                        {cpu.generation && <div dir="rtl" className="text-ink-muted text-right">{cpu.generation}</div>}
                      </td>
                      <td className="p-3 text-ink text-xs whitespace-nowrap">{item.ram || '-'}</td>
                      <td className="p-3 text-ink text-xs whitespace-nowrap">{item.storage || '-'}</td>
                      <td className="p-3 text-ink text-xs">
                        <div>{gpu.name || '-'}</div>
                        {gpu.vram && <div className="text-ink-muted">{gpu.vram}</div>}
                      </td>
                      <td className="p-3 font-bold text-brand-primary whitespace-nowrap text-center">
                        {formatPrice(item.price)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
