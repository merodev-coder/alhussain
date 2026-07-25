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
} from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import { useUploadThing } from '@/lib/uploadthing'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

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
      const res = await fetch('/api/spec-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value: trimmed }),
      })
      if (res.ok) {
        await onAdded()
        onChange(trimmed)
        setNewValue('')
        setAdding(false)
      }
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
      }
      const res = await fetch(
        initial ? `/api/products/${initial.id}` : '/api/products',
        {
          method: initial ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'تعذّر حفظ المنتج')
        return
      }
      onSaved(initial ? 'تم تحديث المنتج بنجاح' : 'تمت إضافة المنتج بنجاح')
    } catch {
      setError('حدث خطأ في الاتصال')
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

// ── Products Tab ────────────────────────────────────────────────────────────────
export default function ProductsTab() {
  const { data, isLoading, error, mutate } = useSWR<{ products: Product[] }>(
    '/api/products',
    fetcher
  )
  const { data: specData, mutate: mutateSpecs } = useSWR<{ options: SpecGroups }>(
    '/api/spec-options',
    fetcher
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const products = data?.products ?? []
  const specs = useMemo<SpecGroups>(
    () => specData?.options ?? { cpu: [], gpu: [], ram: [], storage: [] },
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
    const res = await fetch(`/api/products/${deleting.id}`, { method: 'DELETE' })
    setDeleting(null)
    if (res.ok) {
      mutate()
      flash('success', 'تم حذف المنتج')
    } else {
      flash('error', 'تعذّر حذف المنتج')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-sans font-bold text-ink text-2xl">المنتجات</h2>
          <p className="font-body text-sm text-ink-muted">{products.length} منتج</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-primary text-white font-sans font-bold text-sm hover:bg-brand-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة منتج
        </button>
      </div>

      {banner && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-3 mb-4',
            banner.type === 'success'
              ? 'bg-green-50 border border-green-100 text-green-700'
              : 'bg-red-50 border border-red-100 text-red-600'
          )}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <p className="font-body text-sm">{banner.msg}</p>
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
    </div>
  )
}
