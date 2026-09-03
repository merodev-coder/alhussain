'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import useSWR from 'swr'
import {
  Plus,
  X,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import { useUploadThing } from '@/lib/uploadthing'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

type SpecType = 'cpu' | 'gpu' | 'ram' | 'storage'
type SpecGroups = Record<SpecType, { id: string; value: string }[]>

type ProductForm = {
  name: string
  price: string
  description: string
  cpu: string
  gpu: string
  ram: string
  storage: string
  photos: string[]
  stockStatus: Product['stockStatus']
  discountBadge: string
  visible: boolean
}

const EMPTY_FORM: ProductForm = {
  name: '',
  price: '',
  description: '',
  cpu: '',
  gpu: '',
  ram: '',
  storage: '',
  photos: [],
  stockStatus: 'in_stock',
  discountBadge: '',
  visible: true,
}

const SPEC_LABELS: Record<SpecType, string> = {
  cpu: 'المعالج (CPU)',
  gpu: 'كارت الشاشة (GPU)',
  ram: 'الرام (RAM)',
  storage: 'التخزين (Storage)',
}

const STOCK_LABELS: Record<Product['stockStatus'], string> = {
  in_stock: 'متوفر',
  limited: 'كمية محدودة',
  out_of_stock: 'غير متوفر',
}

// ── Spec select with inline "add new value" ───────────────────────────────────
function SpecSelect({
  type,
  value,
  options,
  onChange,
  onAdded,
}: {
  type: SpecType
  value: string
  options: { id: string; value: string }[]
  onChange: (v: string) => void
  onAdded: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [saving, setSaving] = useState(false)

  const addValue = async () => {
    const trimmed = newValue.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      await api.create_spec_option({ type, value: trimmed })
      await onAdded()
      onChange(trimmed)
      setNewValue('')
      setAdding(false)
    } catch {
      // Error handling could be added here
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="font-body text-sm text-ink">{SPEC_LABELS[type]}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          'w-full rounded-xl border px-3 py-2.5 font-body text-sm bg-canvas border-hairline focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30',
          !value && 'text-ink-muted'
        )}
      >
        <option value="">اختر...</option>
        {options.map(o => (
          <option key={o.id} value={o.value}>
            {o.value}
          </option>
        ))}
      </select>

      {adding ? (
        <div className="flex items-center gap-2">
          <input
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            placeholder="قيمة جديدة"
            className="flex-1 rounded-xl border border-hairline px-3 py-2 font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
          />
          <button
            type="button"
            onClick={addValue}
            disabled={saving}
            className="px-3 py-2 rounded-xl bg-brand-primary text-white font-body text-xs font-semibold disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ'}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false)
              setNewValue('')
            }}
            className="px-2 py-2 rounded-xl bg-surface-1 text-ink-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="font-body text-xs text-brand-primary hover:underline"
        >
          + إضافة قيمة جديدة
        </button>
      )}
    </div>
  )
}

// ── Product form modal ─────────────────────────────────────────────────────────
function ProductFormModal({
  initial,
  specs,
  onClose,
  onSaved,
  refreshSpecs,
}: {
  initial: Product | null
  specs: SpecGroups
  onClose: () => void
  onSaved: (msg: string) => void
  refreshSpecs: () => Promise<unknown>
}) {
  const [form, setForm] = useState<ProductForm>(
    initial
      ? {
          name: initial.name,
          price: String(initial.price),
          description: initial.description,
          cpu: initial.cpu,
          gpu: initial.gpu,
          ram: initial.ram,
          storage: initial.storage,
          photos: initial.photos ?? [],
          stockStatus: initial.stockStatus,
          discountBadge: initial.discountBadge ?? '',
          visible: initial.visible ?? true,
        }
      : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { startUpload, isUploading } = useUploadThing('productPhotos', {
    onClientUploadComplete: res => {
      const urls = (res ?? []).map(r => (r as { ufsUrl?: string; url?: string }).ufsUrl ?? (r as { url: string }).url)
      setForm(prev => ({ ...prev, photos: [...prev.photos, ...urls.filter(Boolean)] }))
    },
    onUploadError: () => setError('تعذّر رفع الصور. تأكد من إعداد UploadThing.'),
  })

  const set = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const movePhoto = (i: number, dir: -1 | 1) => {
    setForm(prev => {
      const photos = [...prev.photos]
      const j = i + dir
      if (j < 0 || j >= photos.length) return prev
      ;[photos[i], photos[j]] = [photos[j], photos[i]]
      return { ...prev, photos }
    })
  }

  const removePhoto = (i: number) =>
    setForm(prev => ({ ...prev, photos: prev.photos.filter((_, idx) => idx !== i) }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.name.trim()) return setError('اسم المنتج مطلوب')
    if (!form.price || Number(form.price) <= 0) return setError('السعر غير صحيح')
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description,
        cpu: form.cpu,
        gpu: form.gpu,
        ram: form.ram,
        storage: form.storage,
        photos: form.photos,
        stockStatus: form.stockStatus,
        discountBadge: form.discountBadge.trim() || undefined,
        visible: form.visible,
      }
      if (initial) {
        await api.update_product(initial.id, payload)
      } else {
        await api.create_product(payload)
      }
      onSaved(initial ? 'تم تحديث المنتج بنجاح' : 'تمت إضافة المنتج بنجاح')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في الاتصال')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-canvas rounded-[24px] border border-hairline w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline sticky top-0 bg-canvas z-10">
          <h2 className="font-sans font-bold text-ink text-lg">
            {initial ? 'تعديل المنتج' : 'إضافة منتج'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-1 flex items-center justify-center transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="font-body text-sm text-ink">اسم المنتج *</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full rounded-xl border border-hairline px-3 py-2.5 font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
              placeholder="مثال: ديل إكس بي إس 15"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-body text-sm text-ink">السعر (ج.م) *</label>
              <input
                type="number"
                value={form.price}
                onChange={e => set('price', e.target.value)}
                className="w-full rounded-xl border border-hairline px-3 py-2.5 font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                placeholder="85000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-body text-sm text-ink">شارة الخصم (اختياري)</label>
              <input
                value={form.discountBadge}
                onChange={e => set('discountBadge', e.target.value)}
                className="w-full rounded-xl border border-hairline px-3 py-2.5 font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                placeholder="-10% أو جديد"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-body text-sm text-ink">الوصف</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-hairline px-3 py-2.5 font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['cpu', 'gpu', 'ram', 'storage'] as SpecType[]).map(type => (
              <SpecSelect
                key={type}
                type={type}
                value={form[type]}
                options={specs[type]}
                onChange={v => set(type, v)}
                onAdded={refreshSpecs}
              />
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="font-body text-sm text-ink">الحالة</label>
            <select
              value={form.stockStatus}
              onChange={e => set('stockStatus', e.target.value as Product['stockStatus'])}
              className="w-full rounded-xl border border-hairline px-3 py-2.5 font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
            >
              {(Object.keys(STOCK_LABELS) as Product['stockStatus'][]).map(s => (
                <option key={s} value={s}>
                  {STOCK_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="visible"
              checked={form.visible}
              onChange={e => set('visible', e.target.checked)}
              className="w-5 h-5 rounded border-hairline accent-brand-primary"
            />
            <label htmlFor="visible" className="font-body text-sm text-ink">
              إظهار المنتج في الصفحة الرئيسية
            </label>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <label className="font-body text-sm text-ink">الصور</label>
            {form.photos.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {form.photos.map((url, i) => (
                  <div key={url + i} className="relative w-24">
                    <div className="w-24 h-20 rounded-xl overflow-hidden border border-hairline bg-surface-1">
                      <Image
                        src={url}
                        alt={`صورة ${i + 1}`}
                        width={96}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute -top-2 -end-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
                      aria-label="حذف الصورة"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex justify-center gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => movePhoto(i, -1)}
                        disabled={i === 0}
                        className="p-1 rounded-md bg-surface-1 text-ink-muted disabled:opacity-30"
                        aria-label="تحريك يمين"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => movePhoto(i, 1)}
                        disabled={i === form.photos.length - 1}
                        className="p-1 rounded-md bg-surface-1 text-ink-muted disabled:opacity-30"
                        aria-label="تحريك يسار"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <label className="flex flex-col items-center gap-2 border-2 border-dashed border-hairline rounded-[16px] p-5 cursor-pointer hover:border-brand-primary/50 hover:bg-surface-1 transition-colors">
              {isUploading ? (
                <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-ink-muted" />
              )}
              <span className="font-body text-xs text-ink-muted">
                {isUploading ? 'جارٍ الرفع...' : 'اضغط لرفع صور المنتج'}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={isUploading}
                onChange={e => {
                  const files = Array.from(e.target.files ?? [])
                  if (files.length) startUpload(files)
                  e.target.value = ''
                }}
              />
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="font-body text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || isUploading}
              className="flex-1 h-11 rounded-full bg-brand-primary text-white font-sans font-bold flex items-center justify-center gap-2 hover:bg-brand-primary/90 disabled:opacity-60 transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {initial ? 'حفظ التعديلات' : 'إضافة المنتج'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 h-11 rounded-full border border-hairline font-sans font-bold text-ink hover:bg-surface-1 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete confirm ─────────────────────────────────────────────────────────────
function DeleteConfirm({
  product,
  onCancel,
  onConfirm,
}: {
  product: Product
  onCancel: () => void
  onConfirm: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-canvas rounded-[24px] border border-hairline w-full max-w-sm p-6 text-center shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="font-sans font-bold text-ink text-lg mb-1">حذف المنتج</h3>
        <p className="font-body text-sm text-ink-muted mb-5">
          هل أنت متأكد من حذف &laquo;{product.name}&raquo;؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              setDeleting(true)
              await onConfirm()
            }}
            disabled={deleting}
            className="flex-1 h-11 rounded-full bg-red-500 text-white font-sans font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            حذف
          </button>
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-full border border-hairline font-sans font-bold text-ink hover:bg-surface-1"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Bulk import modal ──────────────────────────────────────────────────────────
function BulkImportModal({
  onClose,
  onImported,
}: {
  onClose: () => void
  onImported: (created: number, failed: Array<{ index: number; name?: string; error: string }>) => void
}) {
  const [jsonText, setJsonText] = useState('')
  const [parsedItems, setParsedItems] = useState<any[] | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Array<{ index: number; error: string }>>([])

  const DEFAULT_DATA = [
    {
      "name": "HP 645 G1",
      "price": 4500,
      "description": "لابتوب HP 645 G1 مستعمل بحالة ممتازة من الفئة الاقتصادية، شاشة 14.1\"، معالج AMD A10-5300 (5th Gen)، رام 8GB، تخزين 500GB HDD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "AMD A10-5300 (5th Gen)",
      "gpu": "AMD 7620 - Up to 8GB",
      "ram": "8GB",
      "storage": "500GB HDD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "HP 255 G3",
      "price": 4500,
      "description": "لابتوب HP 255 G3 مستعمل بحالة ممتازة من الفئة الاقتصادية، شاشة 14.1\"، معالج AMD A4-53007 (5th Gen)، رام 8GB، تخزين 500GB HDD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "AMD A4-53007 (5th Gen)",
      "gpu": "AMD 7620 - Up to 8GB",
      "ram": "8GB",
      "storage": "500GB HDD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "HP 840 G1",
      "price": 5500,
      "description": "لابتوب HP 840 G1 مستعمل بحالة ممتازة من الفئة الاقتصادية، شاشة 15.6\"، معالج Core i5 (4th Gen)، رام 8GB، تخزين 500GB HDD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i5 (4th Gen)",
      "gpu": "AMD HD 8470M - 1GB إلى 8GB",
      "ram": "8GB",
      "storage": "500GB HDD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 3470",
      "price": 6500,
      "description": "لابتوب DELL 3470 مستعمل بحالة ممتازة من الفئة الاقتصادية، شاشة 14.1\"، معالج Core i5 (6th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i5 (6th Gen)",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL M4800",
      "price": 7000,
      "description": "لابتوب DELL M4800 مستعمل بحالة ممتازة من الفئة الاقتصادية، شاشة 15.6\"، معالج Core i7 (4th Gen)، رام 8GB، تخزين 500GB HDD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i7 (4th Gen)",
      "gpu": "N.VIDIA K1000 - 2GB إلى 20GB",
      "ram": "8GB",
      "storage": "500GB HDD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "Dell 6540",
      "price": 7300,
      "description": "لابتوب Dell 6540 مستعمل بحالة ممتازة من الفئة الاقتصادية، شاشة 15.6\"، معالج Core i7 (4th Gen)، رام 8GB، تخزين 500GB HDD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i7 (4th Gen)",
      "gpu": "AMD HD 8470M - 2GB إلى 8GB",
      "ram": "8GB",
      "storage": "500GB HDD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "Hp 455 G5",
      "price": 7500,
      "description": "لابتوب Hp 455 G5 مستعمل بحالة ممتازة من الفئة الاقتصادية، شاشة 15.6\"، معالج AMD A9-9410 (9th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "AMD A9-9410 (9th Gen)",
      "gpu": "AMD HD R6 - 1GB إلى 8GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 7480",
      "price": 7500,
      "description": "لابتوب DELL 7480 مستعمل بحالة ممتازة من الفئة الاقتصادية، شاشة 14.1\"، معالج Core i5 (7th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i5 (7th Gen)",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "HP ZBOOK G2",
      "price": 7500,
      "description": "لابتوب HP ZBOOK G2 مستعمل بحالة ممتازة من الفئة الاقتصادية، شاشة 15.6\"، معالج Core i7 MQ (4th Gen)، رام 8GB، تخزين 500GB HDD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i7 MQ (4th Gen)",
      "gpu": "N.VIDIA K1000 - 2GB إلى 20GB",
      "ram": "8GB",
      "storage": "500GB HDD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 5580",
      "price": 8000,
      "description": "لابتوب DELL 5580 مستعمل بحالة ممتازة من الفئة المتوسطة، شاشة 15.6\"، معالج Core i5 (6th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i5 (6th Gen)",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 7480",
      "price": 8500,
      "description": "لابتوب DELL 7480 مستعمل بحالة ممتازة من الفئة المتوسطة، شاشة 14.1\"، معالج Core i7 (7th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i7 (7th Gen)",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 5470",
      "price": 8700,
      "description": "لابتوب DELL 5470 مستعمل بحالة ممتازة من الفئة المتوسطة، شاشة 14.1\"، معالج Core i7 (6th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i7 (6th Gen)",
      "gpu": "AMD HD R7 - 2GB إلى 12GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 5400",
      "price": 9000,
      "description": "لابتوب DELL 5400 مستعمل بحالة ممتازة من الفئة المتوسطة، شاشة 14.1\"، معالج Core i5 (8th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i5 (8th Gen)",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 5580",
      "price": 9000,
      "description": "لابتوب DELL 5580 مستعمل بحالة ممتازة من الفئة المتوسطة، شاشة 15.6\"، معالج Core i5 (7th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i5 (7th Gen)",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 3390 X360",
      "price": 9000,
      "description": "لابتوب DELL 3390 X360 مستعمل بحالة ممتازة من الفئة المتوسطة، شاشة 14.1\"، معالج Core i5 (8th Gen) Touch، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i5 (8th Gen) Touch",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 7300",
      "price": 9000,
      "description": "لابتوب DELL 7300 مستعمل بحالة ممتازة من الفئة المتوسطة، شاشة 13.3\"، معالج Core i7 (8th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i7 (8th Gen)",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "HP 650 G3",
      "price": 9000,
      "description": "لابتوب HP 650 G3 مستعمل بحالة ممتازة من الفئة المتوسطة، شاشة 15.6\"، معالج Core i5 (7th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i5 (7th Gen)",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "HP 650 G2",
      "price": 9000,
      "description": "لابتوب HP 650 G2 مستعمل بحالة ممتازة من الفئة المتوسطة، شاشة 15.6\"، معالج Core i7 (6th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i7 (6th Gen)",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "HP ZBOOK G3",
      "price": 9000,
      "description": "لابتوب HP ZBOOK G3 مستعمل بحالة ممتازة من الفئة المتوسطة، شاشة 15.6\"، معالج Core i5 HQ (6th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i5 HQ (6th Gen)",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "HP 650 G2",
      "price": 9800,
      "description": "لابتوب HP 650 G2 مستعمل بحالة ممتازة من الفئة المتوسطة، شاشة 15.6\"، معالج Core i7 (6th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i7 (6th Gen)",
      "gpu": "AMD HD R7 - 2GB إلى 12GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 5590",
      "price": 10000,
      "description": "لابتوب DELL 5590 مستعمل بحالة ممتازة من الفئة المتوسطة، شاشة 15.6\"، معالج Core i5 (8th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i5 (8th Gen)",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 7400",
      "price": 10000,
      "description": "لابتوب DELL 7400 مستعمل بحالة ممتازة من الفئة المتوسطة، شاشة 14.1\"، معالج Core i7 (8th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i7 (8th Gen)",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 5580",
      "price": 10000,
      "description": "لابتوب DELL 5580 مستعمل بحالة ممتازة من الفئة المتوسطة، شاشة 15.6\"، معالج Core i7 (7th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i7 (7th Gen)",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "HP 650 G3",
      "price": 10000,
      "description": "لابتوب HP 650 G3 مستعمل بحالة ممتازة من الفئة المتوسطة، شاشة 15.6\"، معالج Core i7 (7th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i7 (7th Gen)",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 5767",
      "price": 10000,
      "description": "لابتوب DELL 5767 مستعمل بحالة ممتازة من الفئة المتوسطة، شاشة 17.3\"، معالج Core i5 (7th Gen)، رام 8GB، تخزين 512GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i5 (7th Gen)",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "512GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 3510",
      "price": 11000,
      "description": "لابتوب DELL 3510 مستعمل بحالة ممتازة من الفئة المتميزة، شاشة 15.6\"، معالج Core i7 HQ (6th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i7 HQ (6th Gen)",
      "gpu": "AMD W5130 - 2GB إلى 12GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "HP 650 G5",
      "price": 11000,
      "description": "لابتوب HP 650 G5 مستعمل بحالة ممتازة من الفئة المتميزة، شاشة 15.6\"، معالج Core i7 (8th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i7 (8th Gen)",
      "gpu": "Intel UHD - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 5590",
      "price": 11000,
      "description": "لابتوب DELL 5590 مستعمل بحالة ممتازة من الفئة المتميزة، شاشة 15.6\"، معالج Core i7 (8th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i7 (8th Gen)",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "HP 840 G5",
      "price": 11000,
      "description": "لابتوب HP 840 G5 مستعمل بحالة ممتازة من الفئة المتميزة، شاشة 14.1\"، معالج Core i7 (8th Gen)، رام 8GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i7 (8th Gen)",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "8GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 7530",
      "price": 13000,
      "description": "لابتوب DELL 7530 مستعمل بحالة ممتازة من الفئة المتميزة، شاشة 15.6\"، معالج Core i5 H (8th Gen)، رام 16GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i5 H (8th Gen)",
      "gpu": "Intel HD 620 - 1GB إلى 2GB",
      "ram": "16GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "HP ZBOOK G3",
      "price": 13500,
      "description": "لابتوب HP ZBOOK G3 مستعمل بحالة ممتازة من الفئة المتميزة، شاشة 15.6\"، معالج Xeon E3-1505M (7th Gen)، رام 16GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Xeon E3-1505M (7th Gen)",
      "gpu": "N.VIDIA M1000 - 2GB إلى 20GB",
      "ram": "16GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 7510",
      "price": 13500,
      "description": "لابتوب DELL 7510 مستعمل بحالة ممتازة من الفئة المتميزة، شاشة 15.6\"، معالج Xeon E3-1505M (7th Gen)، رام 16GB، تخزين 512GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Xeon E3-1505M (7th Gen)",
      "gpu": "N.VIDIA M1000 - 2GB إلى 20GB",
      "ram": "16GB",
      "storage": "512GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "HP ZBOOK G4",
      "price": 14500,
      "description": "لابتوب HP ZBOOK G4 مستعمل بحالة ممتازة من الفئة المتميزة، شاشة 15.6\"، معالج Core i5 HQ (7th Gen)، رام 16GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i5 HQ (7th Gen)",
      "gpu": "N.VIDIA M1200 - 4GB إلى 20GB",
      "ram": "16GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "HP 855 G7",
      "price": 15000,
      "description": "لابتوب HP 855 G7 مستعمل بحالة ممتازة من الفئة المتميزة، شاشة 15.6\"، معالج Ryzen 5 (10th Gen)، رام 16GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Ryzen 5 (10th Gen)",
      "gpu": "AMD Vega 8 - 2GB إلى 8GB",
      "ram": "16GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 7510",
      "price": 15500,
      "description": "لابتوب DELL 7510 مستعمل بحالة ممتازة من الفئة المتميزة، شاشة 15.6\"، معالج Xeon E3-1505M (7th Gen)، رام 16GB، تخزين 512GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Xeon E3-1505M (7th Gen)",
      "gpu": "N.VIDIA M2000 - 4GB إلى 20GB",
      "ram": "16GB",
      "storage": "512GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "DELL 5584",
      "price": 16000,
      "description": "لابتوب DELL 5584 مستعمل بحالة ممتازة من الفئة المتميزة، شاشة 15.6\"، معالج Core i7 (8th Gen)، رام 16GB، تخزين 256GB SSD + 500GB HDD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i7 (8th Gen)",
      "gpu": "N.VIDIA MX130 - 4GB إلى 20GB",
      "ram": "16GB",
      "storage": "256GB SSD + 500GB HDD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "HP ZBOOK 15u G5",
      "price": 16000,
      "description": "لابتوب HP ZBOOK 15u G5 مستعمل بحالة ممتازة من الفئة المتميزة، شاشة 15.6\"، معالج Core i7 (8th Gen)، رام 16GB، تخزين 256GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i7 (8th Gen)",
      "gpu": "AMD WX 3100 - 4GB إلى 12GB",
      "ram": "16GB",
      "storage": "256GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "HP ZBOOK G5 17",
      "price": 19000,
      "description": "لابتوب HP ZBOOK G5 17 مستعمل بحالة ممتازة من الفئة المتميزة، شاشة 17.3\"، معالج Core i5 H (8th Gen)، رام 16GB، تخزين 512GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i5 H (8th Gen)",
      "gpu": "N.VIDIA P2000 - 4GB إلى 20GB",
      "ram": "16GB",
      "storage": "512GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    },
    {
      "name": "HP ZBOOK G5",
      "price": 22000,
      "description": "لابتوب HP ZBOOK G5 مستعمل بحالة ممتازة من الفئة المتميزة، شاشة 15.6\"، معالج Core i7 H (8th Gen)، رام 16GB، تخزين 512GB SSD. مناسب للاستخدام المكتبي والدراسة والتصفح.",
      "cpu": "Core i7 H (8th Gen)",
      "gpu": "N.VIDIA P2000 - 4GB إلى 20GB",
      "ram": "16GB",
      "storage": "512GB SSD",
      "stockStatus": "in_stock",
      "quantity": 1,
      "visible": true,
      "photos": []
    }
  ]

  const handlePreview = () => {
    setParseError(null)
    setValidationErrors([])
    try {
      const parsed = JSON.parse(jsonText)
      if (!Array.isArray(parsed)) {
        setParseError('يجب أن يكون JSON مصفوفة')
        return
      }
      
      const errors: Array<{ index: number; error: string }> = []
      parsed.forEach((item: any, index: number) => {
        if (!item.name || typeof item.name !== 'string' || !item.name.trim()) {
          errors.push({ index, error: 'اسم المنتج مطلوب' })
        }
        if (!item.price || typeof item.price !== 'number' || item.price <= 0) {
          errors.push({ index, error: 'السعر غير صحيح' })
        }
      })
      
      setParsedItems(parsed)
      setValidationErrors(errors)
    } catch {
      setParseError('JSON غير صحيح')
      setParsedItems(null)
    }
  }

  const handleImport = async () => {
    if (!parsedItems) return
    setImporting(true)
    try {
      const result = await api.bulk_create_products(parsedItems)
      onImported(result.created, result.failed)
      onClose()
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'حدث خطأ في الاتصال')
    } finally {
      setImporting(false)
    }
  }

  const loadDefaultData = () => {
    setJsonText(JSON.stringify(DEFAULT_DATA, null, 2))
    setParseError(null)
    setParsedItems(null)
    setValidationErrors([])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-canvas rounded-[24px] border border-hairline w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline sticky top-0 bg-canvas z-10">
          <h2 className="font-sans font-bold text-ink text-lg">استيراد جماعي للمنتجات</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-1 flex items-center justify-center transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-body text-sm text-ink">بيانات المنتجات (JSON)</label>
              <button
                type="button"
                onClick={loadDefaultData}
                className="font-body text-xs text-brand-primary hover:underline"
              >
                تحميل بيانات الحسين
              </button>
            </div>
            <textarea
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              rows={12}
              className="w-full rounded-xl border border-hairline px-3 py-2.5 font-mono text-xs bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30 resize-none"
              placeholder="[
  {
    &quot;name&quot;: &quot;اسم المنتج&quot;,
    &quot;price&quot;: 10000,
    &quot;description&quot;: &quot;وصف المنتج&quot;,
    &quot;cpu&quot;: &quot;Core i5&quot;,
    &quot;gpu&quot;: &quot;Intel HD&quot;,
    &quot;ram&quot;: &quot;8GB&quot;,
    &quot;storage&quot;: &quot;256GB SSD&quot;,
    &quot;stockStatus&quot;: &quot;in_stock&quot;,
    &quot;quantity&quot;: 1,
    &quot;visible&quot;: true
  }
]"
            />
          </div>

          {parseError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="font-body text-xs text-red-600">{parseError}</p>
            </div>
          )}

          {parsedItems && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <p className="font-body text-xs text-green-600">
                  سيتم استيراد {parsedItems.length} منتج
                </p>
              </div>

              {validationErrors.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                  <p className="font-body text-xs text-amber-700 mb-2">تحذير: {validationErrors.length} منتج بها أخطاء</p>
                  <ul className="space-y-1">
                    {validationErrors.map((err, i) => (
                      <li key={i} className="font-body text-xs text-amber-600">
                        السطر {err.index + 1}: {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-surface-1 rounded-xl p-3 max-h-48 overflow-y-auto">
                <p className="font-body text-xs text-ink-muted mb-2">معاينة:</p>
                <div className="space-y-1">
                  {parsedItems.slice(0, 10).map((item, i) => (
                    <div key={i} className="font-body text-xs text-ink flex justify-between">
                      <span>{item.name}</span>
                      <span>{item.price?.toLocaleString('ar-EG')} ج.م</span>
                    </div>
                  ))}
                  {parsedItems.length > 10 && (
                    <p className="font-body text-xs text-ink-muted">... و {parsedItems.length - 10} منتج آخر</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handlePreview}
              disabled={!jsonText.trim()}
              className="flex-1 h-11 rounded-full border border-hairline font-sans font-bold text-ink hover:bg-surface-1 transition-colors disabled:opacity-60"
            >
              معاينة
            </button>
            <button
              onClick={handleImport}
              disabled={!parsedItems || importing}
              className="flex-1 h-11 rounded-full bg-brand-primary text-white font-sans font-bold flex items-center justify-center gap-2 hover:bg-brand-primary/90 disabled:opacity-60 transition-colors"
            >
              {importing && <Loader2 className="w-4 h-4 animate-spin" />}
              استيراد
            </button>
            <button
              onClick={onClose}
              className="px-6 h-11 rounded-full border border-hairline font-sans font-bold text-ink hover:bg-surface-1 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Products Tab ────────────────────────────────────────────────────────────────
export default function ProductsTab() {
  const { data, isLoading, error, mutate } = useSWR<{ items: Product[]; total: number; page: number; pages: number }>(
    '/api/products',
    fetcher
  )
  const { data: specData, mutate: mutateSpecs } = useSWR<{ id: string; type: string; value: string }[]>(
    '/api/spec-options',
    fetcher
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const products = data?.items ?? []
  const specs = useMemo<SpecGroups>(
    () => {
      const grouped: SpecGroups = { cpu: [], gpu: [], ram: [], storage: [] }
      specData?.forEach(opt => {
        if (opt.type in grouped) {
          grouped[opt.type as SpecType].push({ id: opt.id, value: opt.value })
        }
      })
      return grouped
    },
    [specData]
  )

  const flash = (type: 'success' | 'error', msg: string) => {
    setBanner({ type, msg })
    setTimeout(() => setBanner(null), 3500)
  }

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (p: Product) => {
    setEditing(p)
    setFormOpen(true)
  }

  const handleSaved = (msg: string) => {
    setFormOpen(false)
    setEditing(null)
    mutate()
    flash('success', msg)
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await api.delete_product(deleting.id)
      setDeleting(null)
      mutate()
      flash('success', 'تم حذف المنتج')
    } catch {
      setDeleting(null)
      flash('error', 'تعذّر حذف المنتج')
    }
  }

  const handleBulkImport = async (created: number, failed: Array<{ index: number; name?: string; error: string }>) => {
    mutate()
    mutateSpecs()
    if (failed.length === 0) {
      flash('success', `تم استيراد ${created} منتج بنجاح`)
    } else {
      const failedList = failed.map(f => `${f.name || `المنتج ${f.index + 1}`}: ${f.error}`).join(' | ')
      flash('error', `تم استيراد ${created} منتج، فشل ${failed.length}: ${failedList}`)
    }
  }

  const toggleVisibility = async (product: Product) => {
    try {
      await api.update_product(product.id, { visible: !product.visible })
      mutate()
      flash('success', product.visible ? 'تم إخفاء المنتج' : 'تم إظهار المنتج')
    } catch {
      flash('error', 'تعذّر تغيير حالة الظهور')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-sans font-bold text-ink text-2xl">المنتجات</h2>
          <p className="font-body text-sm text-ink-muted">{products.length} منتج</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setBulkImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-hairline font-sans font-bold text-sm text-ink hover:bg-surface-1 transition-colors"
          >
            <Upload className="w-4 h-4" />
            استيراد جماعي
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-primary text-white font-sans font-bold text-sm hover:bg-brand-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة منتج
          </button>
        </div>
      </div>

      {banner && (
        <div
          className={cn(
            'flex items-start gap-2 rounded-xl px-4 py-3 mb-4',
            banner.type === 'success'
              ? 'bg-green-50 border border-green-100 text-green-700'
              : 'bg-red-50 border border-red-100 text-red-600'
          )}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <p className="font-body text-sm whitespace-pre-line">{banner.msg}</p>
        </div>
      )}

      <div className="bg-canvas border border-hairline rounded-[20px] overflow-hidden">
        <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 bg-surface-1 border-b border-hairline text-xs font-body font-semibold text-ink-muted">
          <span>صورة</span>
          <span>الاسم</span>
          <span>السعر</span>
          <span>الحالة</span>
          <span>إجراء</span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 text-brand-primary animate-spin mx-auto" />
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="font-body text-ink-muted text-sm">تعذّر تحميل المنتجات. تأكد من إعداد قاعدة البيانات.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-body text-ink-muted text-sm">لا توجد منتجات بعد. أضف أول منتج.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-hairline">
              {products.map(p => (
                <div
                  key={p.id}
                  className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto_auto] gap-3 md:gap-4 px-5 py-4 items-center hover:bg-surface-1 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-1 shrink-0">
                    {p.photos?.[0] ? (
                      <Image
                        src={p.photos[0]}
                        alt={p.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="font-body text-sm font-semibold text-ink">{p.name}</p>
                    <p className="font-body text-xs text-ink-muted">
                      {[p.cpu, p.ram, p.storage].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="font-sans font-bold text-sm text-ink">
                    {p.price.toLocaleString('ar-EG')} ج.م
                  </span>
                  <span
                    className={cn(
                      'text-xs font-body px-2.5 py-1 rounded-full font-medium w-fit',
                      p.stockStatus === 'in_stock'
                        ? 'bg-green-100 text-green-700'
                        : p.stockStatus === 'limited'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-600'
                    )}
                  >
                    {STOCK_LABELS[p.stockStatus]}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleVisibility(p)}
                      className="flex items-center gap-1 text-xs font-body text-ink-muted hover:text-ink"
                      title={p.visible ? 'إخفاء' : 'إظهار'}
                    >
                      {p.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="flex items-center gap-1 text-xs font-body text-brand-primary hover:underline"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      تعديل
                    </button>
                    <button
                      onClick={() => setDeleting(p)}
                      className="flex items-center gap-1 text-xs font-body text-red-500 hover:underline"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination could be added here if needed */}
          </>
        )}
      </div>

      {formOpen && (
        <ProductFormModal
          initial={editing}
          specs={specs}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
          onSaved={handleSaved}
          refreshSpecs={mutateSpecs}
        />
      )}

      {deleting && (
        <DeleteConfirm
          product={deleting}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}

      {bulkImportOpen && (
        <BulkImportModal
          onClose={() => setBulkImportOpen(false)}
          onImported={handleBulkImport}
        />
      )}
    </div>
  )
}
