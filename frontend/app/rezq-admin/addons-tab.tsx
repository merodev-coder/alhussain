'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Plus,
  X,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  Eye,
  EyeOff,
  Package,
} from 'lucide-react'
import { useUploadThing } from '@/lib/uploadthing'
import type { Addon, AddonCategory, StockStatus, Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

type AddonForm = {
  name: string
  price: string
  description: string
  category: AddonCategory
  compatibleWith: string[]
  photos: string[]
  stockStatus: StockStatus
  quantity: string
  visible: boolean
}

const EMPTY_FORM: AddonForm = {
  name: '',
  price: '',
  description: '',
  category: 'other',
  compatibleWith: [],
  photos: [],
  stockStatus: 'in_stock',
  quantity: '0',
  visible: true,
}

const CATEGORY_LABELS: Record<AddonCategory, string> = {
  ram: 'رام إضافية',
  storage: 'تخزين / SSD',
  accessory: 'ملحق',
  other: 'أخرى',
}

const STOCK_LABELS: Record<StockStatus, string> = {
  in_stock: 'متوفر',
  limited: 'محدود',
  out_of_stock: 'غير متوفر',
}

export default function AddonsTab() {
  const [addons, setAddons] = useState<Addon[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AddonForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { startUpload, isUploading } = useUploadThing('productPhotos')

  const fetchData = async () => {
    try {
      setLoading(true)
      const [addonsRes, prodsRes] = await Promise.all([
        api.get_addons(),
        api.get_products(),
      ])
      setAddons(addonsRes || [])
      setProducts(Array.isArray(prodsRes) ? prodsRes : prodsRes?.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenCreate = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (addon: Addon) => {
    setForm({
      name: addon.name,
      price: addon.price.toString(),
      description: addon.description || '',
      category: addon.category || 'other',
      compatibleWith: addon.compatibleWith || [],
      photos: addon.photos || [],
      stockStatus: addon.stockStatus || 'in_stock',
      quantity: (addon.quantity ?? 0).toString(),
      visible: addon.visible ?? true,
    })
    setEditingId(addon.id)
    setIsModalOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const res = await startUpload(files)
    if (res) {
      const urls = res.map(f => f.url)
      setForm(prev => ({ ...prev, photos: [...prev.photos, ...urls] }))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return alert('اسم الإضافة مطلوب')
    const priceNum = parseFloat(form.price)
    if (isNaN(priceNum) || priceNum < 0) return alert('السعر غير صحيح')

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        price: priceNum,
        description: form.description.trim(),
        category: form.category,
        compatibleWith: form.compatibleWith,
        photos: form.photos,
        stockStatus: form.stockStatus,
        quantity: parseInt(form.quantity, 10) || 0,
        visible: form.visible,
      }

      if (editingId) {
        await api.update_addon(editingId, payload)
      } else {
        await api.create_addon(payload)
      }

      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت تأكد من حذف هذه الإضافة؟')) return
    setDeletingId(id)
    try {
      await api.delete_addon(id)
      setAddons(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleVisible = async (addon: Addon) => {
    try {
      const updated = await api.update_addon(addon.id, { visible: !addon.visible })
      setAddons(prev => prev.map(a => (a.id === addon.id ? { ...a, visible: updated.visible } : a)))
    } catch (err) {
      alert('فشل تغيير الحالة')
    }
  }

  if (loading) return <div className="py-8 text-center text-ink-muted">جاري تحميل الإضافات...</div>

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-sans font-bold text-ink text-2xl">الإضافات (Addons)</h2>
          <p className="font-body text-sm text-ink-muted">
            ترقيات وإضافات اختيارية للأجهزة (رام، storage، حقيبة، إلخ)
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white font-sans font-bold text-sm hover:bg-brand-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة جديدة
        </button>
      </div>

      {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>}

      <div className="bg-canvas border border-hairline rounded-[20px] overflow-hidden shadow-sm">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="bg-surface-1 border-b border-hairline text-xs font-body font-semibold text-ink-muted">
              <th className="px-5 py-3 text-start">الاسم</th>
              <th className="px-5 py-3 text-start">الفئة</th>
              <th className="px-5 py-3 text-start">السعر</th>
              <th className="px-5 py-3 text-start">الكمية</th>
              <th className="px-5 py-3 text-start">التوافق</th>
              <th className="px-5 py-3 text-start">الحالة</th>
              <th className="px-5 py-3 text-end">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {addons.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-ink-muted">
                  لا توجد إضافات بعد
                </td>
              </tr>
            ) : (
              addons.map(addon => (
                <tr key={addon.id} className="hover:bg-surface-1/50 transition-colors">
                  <td className="px-5 py-4 font-sans font-bold text-ink text-sm">
                    {addon.name}
                  </td>
                  <td className="px-5 py-4 font-body text-xs text-ink-muted">
                    {CATEGORY_LABELS[addon.category] || addon.category}
                  </td>
                  <td className="px-5 py-4 font-sans font-bold text-brand-primary text-sm">
                    {addon.price.toLocaleString('ar-EG')} ج.م
                  </td>
                  <td className="px-5 py-4 font-body text-sm text-ink">
                    {addon.quantity ?? 0}
                  </td>
                  <td className="px-5 py-4 font-body text-xs text-ink-muted max-w-xs truncate">
                    {addon.compatibleWith.length === 0
                      ? 'متوافق مع كل اللابتوبات'
                      : `${addon.compatibleWith.length} أجهزة محدودة`}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        'inline-block px-2.5 py-0.5 rounded-full text-xs font-body',
                        addon.stockStatus === 'in_stock'
                          ? 'bg-green-100 text-green-700'
                          : addon.stockStatus === 'limited'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-600'
                      )}
                    >
                      {STOCK_LABELS[addon.stockStatus]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-end space-s-2">
                    <button
                      onClick={() => handleToggleVisible(addon)}
                      className="p-1.5 rounded-lg text-ink-muted hover:bg-surface-2 transition-colors"
                      title={addon.visible ? 'إخفاء' : 'إظهار'}
                    >
                      {addon.visible ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(addon)}
                      className="p-1.5 rounded-lg text-ink-muted hover:bg-surface-2 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(addon.id)}
                      disabled={deletingId === addon.id}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-canvas border border-hairline rounded-[24px] w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-hairline">
              <h3 className="font-sans font-bold text-ink text-lg">
                {editingId ? 'تعديل الإضافة' : 'إضافة جديدة'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-1 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block font-body text-xs text-ink-muted mb-1">اسم الإضافة *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="مثال: رام 8 جيجا DDR4 إضافية"
                  className="w-full px-3 py-2 border border-hairline rounded-xl font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-body text-xs text-ink-muted mb-1">السعر (ج.م) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-hairline rounded-xl font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs text-ink-muted mb-1">الفئة</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as AddonCategory }))}
                    className="w-full px-3 py-2 border border-hairline rounded-xl font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-body text-xs text-ink-muted mb-1">الكمية بالمخزن</label>
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    className="w-full px-3 py-2 border border-hairline rounded-xl font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs text-ink-muted mb-1">حالة التوفر</label>
                  <select
                    value={form.stockStatus}
                    onChange={e => setForm(f => ({ ...f, stockStatus: e.target.value as StockStatus }))}
                    className="w-full px-3 py-2 border border-hairline rounded-xl font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                  >
                    <option value="in_stock">متوفر</option>
                    <option value="limited">محدود</option>
                    <option value="out_of_stock">غير متوفر</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-body text-xs text-ink-muted mb-1">التوافق مع الأجهزة</label>
                <p className="font-body text-[11px] text-ink-muted mb-2">
                  اترك القائمة غير محددة لتكون الإضافة متاحة لجميع الأجهزة، أو اختر أجهزة محددة:
                </p>
                <div className="max-h-36 overflow-y-auto border border-hairline rounded-xl p-2 space-y-1 bg-surface-1">
                  {products.map(p => {
                    const checked = form.compatibleWith.includes(p.id)
                    return (
                      <label key={p.id} className="flex items-center gap-2 text-xs font-body text-ink cursor-pointer hover:bg-canvas p-1 rounded">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            if (e.target.checked) {
                              setForm(f => ({ ...f, compatibleWith: [...f.compatibleWith, p.id] }))
                            } else {
                              setForm(f => ({ ...f, compatibleWith: f.compatibleWith.filter(id => id !== p.id) }))
                            }
                          }}
                          className="rounded border-hairline text-brand-primary focus:ring-[#0FC7C1]"
                        />
                        <span>{p.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block font-body text-xs text-ink-muted mb-1">الوصف</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-hairline rounded-xl font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                />
              </div>

              {/* Upload photos */}
              <div>
                <label className="block font-body text-xs text-ink-muted mb-1">صور الإضافة</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.photos.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-hairline">
                      <Image src={url} alt="" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))}
                        className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-hairline rounded-xl cursor-pointer hover:bg-surface-1 text-xs font-body text-ink-muted">
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'جاري الرفع...' : 'رفع صورة الإضافة'}
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-hairline font-body text-sm hover:bg-surface-1"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving || isUploading}
                  className="px-5 py-2 rounded-xl bg-brand-primary text-white font-sans font-bold text-sm hover:bg-brand-primary/90 disabled:opacity-50"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
