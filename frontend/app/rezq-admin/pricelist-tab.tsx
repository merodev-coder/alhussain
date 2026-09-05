'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Upload,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  Filter,
} from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { clientLogger } from '@/lib/client-logger'

interface StructuredLaptopItem {
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

export default function PricelistTab() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [pricelist, setPricelist] = useState<PricelistData | null>(null)
  const [filterMode, setFilterMode] = useState<'all' | 'flagged'>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch current published pricelist on mount
  useEffect(() => {
    const fetchCurrent = async () => {
      try {
        setInitialLoading(true)
        const data = await api.get_pricelist()
        if (data) {
          setPricelist(data)
        }
      } catch (err) {
        // 404 or no active pricelist is normal on first use
        clientLogger.info('No existing pricelist or failed fetch:', err)
      } finally {
        setInitialLoading(false)
      }
    }
    fetchCurrent()
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.xlsx')) {
        setError('يجب اختيار ملف Excel (.xlsx) فقط')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError('')
      setSuccess(false)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('يرجى اختيار ملف أولاً')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const result = await api.upload_pricelist(file)
      setPricelist(result)
      setSuccess(true)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      clientLogger.error('Pricelist upload error:', err)
      setError(err instanceof Error ? err.message : 'فشل رفع ومعالجة قائمة الأسعار')
    } finally {
      setLoading(false)
    }
  }

  const items = pricelist?.structuredItems || []
  const flaggedCount = items.filter(it => it.flagged).length
  const displayedItems =
    filterMode === 'flagged' ? items.filter(it => it.flagged) : items

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-sans font-bold text-ink text-2xl mb-2">قائمة الأسعار</h2>
        <p className="font-body text-sm text-ink-muted">
          ارفع ملف Excel (.xlsx) وسيقوم الذكاء الاصطناعي (Gemini) بتوحيد صيغ الأجهزة ومواصفاتها،
          واستنتاج حجم الشاشة وكارت الشاشة للموديلات غير المكتملة.
        </p>
      </div>

      {/* Upload Card */}
      <div className="bg-canvas border border-hairline rounded-[20px] p-6 shadow-sm">
        <label className="block">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileSelect}
            disabled={loading}
            className="hidden"
          />
          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
              file
                ? 'border-brand-primary bg-brand-primary/5'
                : 'border-hairline hover:border-brand-primary hover:bg-surface-1'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileSpreadsheet className="w-10 h-10 text-brand-primary mx-auto mb-3" />
            <p className="font-body font-semibold text-sm text-ink mb-1">
              {file ? file.name : 'اسحب ملف Excel هنا أو انقر للاختيار'}
            </p>
            <p className="font-body text-xs text-ink-muted">
              الصيغة المدعومة: .xlsx (Excel) بأي ترتيب للأعمدة
            </p>
          </div>
        </label>

        <div className="flex flex-wrap items-center gap-3 mt-6">
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={cn(
              'px-6 py-2.5 rounded-lg font-body font-semibold text-sm transition-all flex items-center gap-2',
              file && !loading
                ? 'bg-brand-primary text-white hover:bg-brand-primary/90 shadow-sm'
                : 'bg-surface-1 text-ink-muted cursor-not-allowed'
            )}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                جاري المعالجة بالذكاء الاصطناعي...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                رفع ومعالجة قائمة الأسعار
              </>
            )}
          </button>

          {file && !loading && (
            <button
              onClick={() => {
                setFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="px-4 py-2.5 rounded-lg font-body text-sm text-ink-muted hover:bg-surface-1 border border-hairline"
            >
              إلغاء الملف
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div>
            <p className="font-body font-semibold">فشل في المعالجة</p>
            <p className="font-body text-sm mt-0.5 text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {success && pricelist && (
        <div className="flex gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <div>
            <p className="font-body font-semibold">تمت المعالجة والنشر بنجاح</p>
            <p className="font-body text-sm mt-0.5 text-emerald-700">
              تم تحديث قائمة الأسعار بنجاح ({items.length} جهاز). التاريخ: {new Date(pricelist.uploadedAt).toLocaleString('ar-EG')}
            </p>
          </div>
        </div>
      )}

      {/* Flagged Alert Banner */}
      {flaggedCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-800">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <div className="flex-1">
            <p className="font-body font-semibold">
              تنبيه: تم وضع علامة على {flaggedCount} صف بحاجة لمراجعة
            </p>
            <p className="font-body text-sm mt-1 text-amber-700 leading-relaxed">
              تحتوي هذه الصفوف على مواصفات غير مكتملة في الملف الأصلي أو تم استنتاجها تلقائياً.
              يمكنك مراجعتها في الجدول أدناه، أو تعديلها في ملف Excel وإعادة الرفع.
            </p>
          </div>
          <button
            onClick={() => setFilterMode(filterMode === 'flagged' ? 'all' : 'flagged')}
            className="px-3 py-1.5 bg-amber-200/70 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-semibold shrink-0"
          >
            {filterMode === 'flagged' ? 'عرض الكل' : 'عرض المحتاجة مراجعة فقط'}
          </button>
        </div>
      )}

      {/* Preview Section */}
      {initialLoading ? (
        <div className="p-8 text-center bg-canvas border border-hairline rounded-[20px]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-primary mb-2" />
          <p className="font-body text-sm text-ink-muted">جاري تحميل قائمة الأسعار الحالية...</p>
        </div>
      ) : pricelist && items.length > 0 ? (
        <div className="bg-canvas border border-hairline rounded-[20px] p-6 space-y-4 shadow-sm">
          {/* Header & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-hairline">
            <div>
              <h3 className="font-sans font-bold text-ink text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-brand-primary" />
                معاينة قائمة الأسعار المنشورة ({items.length} جهاز)
              </h3>
              <p className="font-body text-xs text-ink-muted mt-1">
                الملف الأصلي: {pricelist.sourceFileName} &bull; تاريخ التحديث: {new Date(pricelist.uploadedAt).toLocaleString('ar-EG')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Tabs */}
              <div className="flex items-center bg-surface-1 border border-hairline rounded-lg p-1 text-xs">
                <button
                  onClick={() => setFilterMode('all')}
                  className={cn(
                    'px-3 py-1 rounded-md font-medium transition-colors',
                    filterMode === 'all'
                      ? 'bg-canvas text-brand-primary font-bold shadow-xs'
                      : 'text-ink-muted hover:text-ink'
                  )}
                >
                  الكل ({items.length})
                </button>
                <button
                  onClick={() => setFilterMode('flagged')}
                  className={cn(
                    'px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1',
                    filterMode === 'flagged'
                      ? 'bg-canvas text-amber-700 font-bold shadow-xs'
                      : 'text-ink-muted hover:text-ink'
                  )}
                >
                  {flaggedCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                  تحتاج مراجعة ({flaggedCount})
                </button>
              </div>

              {/* Download Original Excel */}
              {pricelist.rawExcelFileUrl && (
                <a
                  href={pricelist.rawExcelFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-1 hover:bg-surface-2 border border-hairline rounded-lg text-xs font-medium text-ink transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-brand-primary" />
                  تحميل ملف Excel
                </a>
              )}
            </div>
          </div>

          {/* Structured Table */}
          <div className="overflow-x-auto rounded-xl border border-hairline">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-surface-2 text-ink font-semibold text-xs border-b border-hairline">
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">اسم وموديل الجهاز</th>
                  <th className="p-3">المعالج (CPU)</th>
                  <th className="p-3">الرام</th>
                  <th className="p-3">التخزين</th>
                  <th className="p-3">الشاشة</th>
                  <th className="p-3">كارت الشاشة (GPU)</th>
                  <th className="p-3">السعر (EGP)</th>
                  <th className="p-3 text-center">حالة التدقيق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {displayedItems.map((item, idx) => {
                  const isFlagged = Boolean(item.flagged)
                  return (
                    <tr
                      key={idx}
                      className={cn(
                        'transition-colors',
                        isFlagged
                          ? 'bg-amber-50/70 hover:bg-amber-100/60'
                          : 'hover:bg-surface-1/70'
                      )}
                    >
                      <td className="p-3 text-center text-xs text-ink-muted font-medium">
                        {item.index ?? idx + 1}
                      </td>
                      <td className="p-3 font-semibold text-ink">
                        <div>{item.name || `${item.brand} ${item.model}`.trim()}</div>
                        {item.category && (
                          <span className="text-[11px] font-normal text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            {item.category}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-ink-muted text-xs">{item.cpu || '-'}</td>
                      <td className="p-3 text-ink-muted text-xs whitespace-nowrap">{item.ram || '-'}</td>
                      <td className="p-3 text-ink-muted text-xs whitespace-nowrap">{item.storage || '-'}</td>
                      <td className="p-3 text-ink-muted text-xs whitespace-nowrap">{item.screen || '-'}</td>
                      <td className="p-3 text-ink-muted text-xs">{item.gpu || '-'}</td>
                      <td className="p-3 font-bold text-brand-primary whitespace-nowrap">
                        {Number(item.price || 0).toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        {isFlagged ? (
                          <div
                            className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-xs"
                            title={item.flagReason || 'يحتاج لمراجعة'}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{item.flagReason || 'يحتاج مراجعة'}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>مكتمل</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {displayedItems.length === 0 && (
            <div className="text-center py-8 text-ink-muted text-sm">
              لا توجد أجهزة مطابقة لخيارات التصفية
            </div>
          )}
        </div>
      ) : pricelist && pricelist.parsedHtml ? (
        // Fallback for legacy HTML pricelist if structuredItems is not present
        <div className="bg-canvas border border-hairline rounded-[20px] p-6 space-y-4 shadow-sm">
          <h3 className="font-sans font-bold text-ink mb-2">معاينة المحتوى الحالي</h3>
          <div
            className="prose max-w-none overflow-auto bg-surface-1 rounded-lg p-4"
            dangerouslySetInnerHTML={{ __html: pricelist.parsedHtml }}
          />
        </div>
      ) : (
        <div className="bg-canvas border border-hairline rounded-[20px] p-8 text-center text-ink-muted">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-ink-muted mb-2 opacity-50" />
          <p className="font-body text-sm">لا توجد قائمة أسعار منشورة حالياً. قم برفع ملف Excel أعلاه.</p>
        </div>
      )}
    </div>
  )
}
