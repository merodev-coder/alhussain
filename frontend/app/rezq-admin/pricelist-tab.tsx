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
  Edit3,
  Check,
  X,
  Save,
} from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { clientLogger } from '@/lib/client-logger'

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

export default function PricelistTab() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [pricelist, setPricelist] = useState<PricelistData | null>(null)
  const [filterMode, setFilterMode] = useState<'all' | 'flagged'>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Inline Editing State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<StructuredLaptopItem>>({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [editMessage, setEditMessage] = useState<string>('')

  // Fetch current pricelist on mount (using admin endpoint to retain rawExcelFileUrl)
  useEffect(() => {
    const fetchCurrent = async () => {
      try {
        setInitialLoading(true)
        const data = await api.get_admin_pricelist().catch(() => api.get_pricelist())
        if (data) {
          setPricelist(data)
        }
      } catch (err) {
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
    setEditingId(null)

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

  const startEdit = (item: StructuredLaptopItem) => {
    const identifier = item.id || String(item.index)
    setEditingId(identifier)
    setEditForm({
      name: item.name,
      cpu: item.cpu,
      ram: item.ram,
      storage: item.storage,
      screen: item.screen,
      gpu: item.gpu,
      price: item.price,
      category: item.category,
      brand: item.brand,
      model: item.model,
    })
    setEditMessage('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleSaveItem = async (item: StructuredLaptopItem) => {
    if (!pricelist?.id) {
      setError('تعذر تحديد معرف قائمة الأسعار للحفظ')
      return
    }

    setSavingEdit(true)
    setEditMessage('')

    try {
      const identifier = item.id || String(item.index)
      const updatedPricelist = await api.update_pricelist_item(
        pricelist.id,
        identifier,
        editForm
      )
      setPricelist(updatedPricelist)
      setEditingId(null)
      setEditMessage('تم تحديث الجهاز وإعادة الترتيب بنجاح')
      setTimeout(() => setEditMessage(''), 3500)
    } catch (err) {
      clientLogger.error('Failed to update item:', err)
      setError(err instanceof Error ? err.message : 'فشل تحديث بيانات الجهاز')
    } finally {
      setSavingEdit(false)
    }
  }

  const items = pricelist?.structuredItems || []
  const flaggedCount = items.filter(it => it.flagged).length
  const displayedItems =
    filterMode === 'flagged' ? items.filter(it => it.flagged) : items

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-sans font-bold text-ink text-2xl mb-2">إدارة قائمة الأسعار</h2>
        <p className="font-body text-sm text-ink-muted">
          ارفع ملف Excel (.xlsx) وسيقوم النظام بتطبيع المواصفات، أو قم بتعديل أي جهاز مباشرة من الجدول أدناه دون الحاجة لإعادة الرفع.
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
              الصيغة المدعومة: .xlsx (Excel) بأي ترتيب أو لغة للأعمدة
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

      {/* Notifications */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div>
            <p className="font-body font-semibold">تنبيه</p>
            <p className="font-body text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {editMessage && (
        <div className="flex gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-300">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <p className="font-body font-semibold text-sm">{editMessage}</p>
        </div>
      )}

      {success && pricelist && (
        <div className="flex gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-300">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <div>
            <p className="font-body font-semibold">تمت المعالجة والنشر بنجاح</p>
            <p className="font-body text-sm mt-0.5">
              تم تحديث قائمة الأسعار بنجاح ({items.length} جهاز). مرتبة تصاعدياً حسب السعر.
            </p>
          </div>
        </div>
      )}

      {/* Flagged Alert Banner */}
      {flaggedCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="font-body font-semibold">
              تنبيه: يوجد {flaggedCount} صف بحاجة لمراجعة أو مواصفات مستنتجة
            </p>
            <p className="font-body text-sm mt-1 leading-relaxed">
              يمكنك النقر على زر <strong>تعديل</strong> أمام أي جهاز لتصحيح مواصفاته وحفظه مباشرة في قاعدة البيانات دون إعادة رفع الملف.
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

      {/* Interactive Table Section */}
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
                قائمة الأسعار المنشورة ({items.length} جهاز — مرتبة حسب السعر)
              </h3>
              <p className="font-body text-xs text-ink-muted mt-1">
                الملف الأصلي: {pricelist.sourceFileName} &bull; تاريخ التحديث: {new Date(pricelist.uploadedAt).toLocaleString('ar-EG')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Tabs */}
              <div className="flex items-center bg-surface-1 border border-hairline rounded-lg p-1 text-xs font-body">
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

              {/* Admin-only Download Link */}
              {pricelist.rawExcelFileUrl && (
                <a
                  href={pricelist.rawExcelFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-1 hover:bg-surface-2 border border-hairline rounded-lg text-xs font-medium text-ink transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-brand-primary" />
                  تحميل ملف Excel الأصلي
                </a>
              )}
            </div>
          </div>

          {/* Structured Table with Inline Editing */}
          <div className="overflow-x-auto rounded-xl border border-hairline">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-surface-2 text-ink font-semibold text-xs border-b border-hairline">
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3 min-w-[180px]">اسم وموديل الجهاز</th>
                  <th className="p-3 min-w-[140px]">المعالج (CPU)</th>
                  <th className="p-3 min-w-[90px]">الرام</th>
                  <th className="p-3 min-w-[110px]">التخزين</th>
                  <th className="p-3 min-w-[90px]">الشاشة</th>
                  <th className="p-3 min-w-[130px]">كارت الشاشة</th>
                  <th className="p-3 min-w-[100px]">السعر (EGP)</th>
                  <th className="p-3 min-w-[120px]">الفئة</th>
                  <th className="p-3 text-center min-w-[100px]">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline font-body">
                {displayedItems.map((item, idx) => {
                  const identifier = item.id || String(item.index)
                  const isEditing = editingId === identifier
                  const isFlagged = Boolean(item.flagged)

                  if (isEditing) {
                    return (
                      <tr key={identifier} className="bg-brand-primary/5 dark:bg-brand-primary/10">
                        <td className="p-2 text-center text-xs font-bold text-brand-primary">
                          {item.index ?? idx + 1}
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editForm.name || ''}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full bg-canvas border border-hairline rounded px-2 py-1 text-xs text-ink font-bold"
                            placeholder="اسم الجهاز"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editForm.cpu || ''}
                            onChange={e => setEditForm({ ...editForm, cpu: e.target.value })}
                            className="w-full bg-canvas border border-hairline rounded px-2 py-1 text-xs text-ink"
                            placeholder="المعالج"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editForm.ram || ''}
                            onChange={e => setEditForm({ ...editForm, ram: e.target.value })}
                            className="w-full bg-canvas border border-hairline rounded px-2 py-1 text-xs text-ink"
                            placeholder="الرام"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editForm.storage || ''}
                            onChange={e => setEditForm({ ...editForm, storage: e.target.value })}
                            className="w-full bg-canvas border border-hairline rounded px-2 py-1 text-xs text-ink"
                            placeholder="التخزين"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editForm.screen || ''}
                            onChange={e => setEditForm({ ...editForm, screen: e.target.value })}
                            className="w-full bg-canvas border border-hairline rounded px-2 py-1 text-xs text-ink"
                            placeholder="الشاشة"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editForm.gpu || ''}
                            onChange={e => setEditForm({ ...editForm, gpu: e.target.value })}
                            className="w-full bg-canvas border border-hairline rounded px-2 py-1 text-xs text-ink"
                            placeholder="كارت الشاشة"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={editForm.price ?? ''}
                            onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })}
                            className="w-full bg-canvas border border-hairline rounded px-2 py-1 text-xs font-bold text-brand-primary font-mono"
                            placeholder="السعر"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editForm.category || ''}
                            onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                            className="w-full bg-canvas border border-hairline rounded px-2 py-1 text-xs text-ink"
                            placeholder="الفئة"
                          />
                        </td>
                        <td className="p-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSaveItem(item)}
                              disabled={savingEdit}
                              className="p-1.5 bg-brand-primary text-white hover:bg-brand-primary/90 rounded-md text-xs transition-colors"
                              title="حفظ التعديلات"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={savingEdit}
                              className="p-1.5 bg-surface-2 text-ink-muted hover:text-ink rounded-md text-xs transition-colors"
                              title="إلغاء"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr
                      key={identifier}
                      className={cn(
                        'transition-colors',
                        isFlagged
                          ? 'bg-amber-50/70 dark:bg-amber-950/20 hover:bg-amber-100/60'
                          : 'hover:bg-surface-1/70'
                      )}
                    >
                      <td className="p-3 text-center text-xs text-ink-muted font-medium">
                        {item.index ?? idx + 1}
                      </td>
                      <td className="p-3 font-semibold text-ink">
                        <div>{item.name || `${item.brand} ${item.model}`.trim()}</div>
                        {isFlagged && item.flagReason && (
                          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-normal mt-0.5 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>{item.flagReason}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-ink text-xs">{item.cpu || '-'}</td>
                      <td className="p-3 text-ink text-xs whitespace-nowrap">{item.ram || '-'}</td>
                      <td className="p-3 text-ink text-xs whitespace-nowrap">{item.storage || '-'}</td>
                      <td className="p-3 text-ink text-xs whitespace-nowrap">{item.screen || '-'}</td>
                      <td className="p-3 text-ink-muted text-xs">{item.gpu || '-'}</td>
                      <td className="p-3 font-bold text-brand-primary whitespace-nowrap font-mono">
                        {Number(item.price || 0).toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="p-3 text-xs text-ink-muted whitespace-nowrap">
                        {item.category ? (
                          <span className="bg-surface-2 text-brand-primary px-2 py-0.5 rounded text-[11px] font-medium">
                            {item.category}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => startEdit(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-ink bg-surface-1 hover:bg-surface-2 border border-hairline rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3 h-3 text-brand-primary" />
                          <span>تعديل</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
