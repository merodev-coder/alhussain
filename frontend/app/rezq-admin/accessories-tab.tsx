'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Plus,
  X,
  Pencil,
  Trash2,
  Upload,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useUploadThing } from '@/lib/uploadthing'
import type { Accessory, StockStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

type AccessoryForm = {
  name: string
  price: string
  description: string
  category: string
  photos: string[]
  stockStatus: StockStatus
  quantity: string
  visible: boolean
}

const EMPTY_FORM: AccessoryForm = {
  name: '',
  price: '',
  description: '',
  category: 'حقائب ومحافظ',
  photos: [],
  stockStatus: 'in_stock',
  quantity: '0',
  visible: true,
}

const STOCK_LABELS: Record<StockStatus, string> = {
  in_stock: 'متوفر',
  limited: 'محدود',
  out_of_stock: 'غير متوفر',
}

const CATEGORY_SUGGESTIONS = [
  'حقائب ومحافظ',
  'ماوس وكيبورد',
  'شواحن وكابلات',
  'سماعات وصوتيات',
  'تبريد واستاندات',
  'وصلات ومحولات',
  'أخرى',
]

export default function AccessoriesTab() {
  const [accessories, setAccessories] = useState<Accessory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AccessoryForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { startUpload, isUploading } = useUploadThing('productPhotos')

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get_accessories()
      const items = Array.isArray(res) ? res : res?.items || []
      setAccessories(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الإكسسوارات')
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

  const handleOpenEdit = (acc: Accessory) => {
    setForm({
      name: acc.name,
      price: acc.price.toString(),
      description: acc.description || '',
      category: acc.category || 'أخرى',
      photos: acc.photos || [],
      stockStatus: acc.stockStatus || 'in_stock',
      quantity: (acc.quantity ?? 0).toString(),
      visible: acc.visible ?? true,
    })
    setEditingId(acc.id)
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
    if (!form.name.trim()) return alert('اسم الإكسسوار مطلوب')
    const priceNum = parseFloat(form.price)
    if (isNaN(priceNum) || priceNum < 0) return alert('السعر غير صحيح')

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        price: priceNum,
        description: form.description.trim(),
        category: form.category.trim() || 'أخرى',
        photos: form.photos,
        stockStatus: form.stockStatus,
        quantity: parseInt(form.quantity, 10) || 0,
        visible: form.visible,
      }

      if (editingId) {
        await api.update_accessory(editingId, payload)
      } else {
        await api.create_accessory(payload)
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
    if (!confirm('هل أنت تأكد من حذف هذا الإكسسوار؟')) return
    setDeletingId(id)
    try {
      await api.delete_accessory(id)
      setAccessories(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل الحذف')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleVisible = async (acc: Accessory) => {
    try {
      const updated = await api.update_accessory(acc.id, { visible: !acc.visible })
      setAccessories(prev => prev.map(a => (a.id === acc.id ? { ...a, visible: updated.visible } : a)))
    } catch (err) {
      alert('فشل تغيير الحالة')
    }
  }

  if (loading) return <div className="py-8 text-center text-ink-muted">جاري تحميل الإكسسوارات...</div>

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-sans font-bold text-ink text-2xl">الإكسسوارات (Accessories)</h2>
          <p className="font-body text-sm text-ink-muted">
            منتجات قائمة بذاتها تباع منفصلة عن اللابتوبات (حقائب، ماوسات، شواحن، إلخ)
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white font-sans font-bold text-sm hover:bg-brand-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة جديد
        </button>
      </div>

      {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>}

      <div className="bg-canvas border border-hairline rounded-[20px] overflow-hidden shadow-sm">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="bg-surface-1 border-b border-hairline text-xs font-body font-semibold text-ink-muted">
              <th className="px-5 py-3 text-start">الصورة</th>
              <th className="px-5 py-3 text-start">الاسم</th>
              <th className="px-5 py-3 text-start">الفئة</th>
              <th className="px-5 py-3 text-start">السعر</th>
              <th className="px-5 py-3 text-start">الكمية</th>
              <th className="px-5 py-3 text-start">الحالة</th>
              <th className="px-5 py-3 text-end">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {accessories.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-ink-muted">
                  لا توجد إكسسوارات بعد
                </td>
              </tr>
            ) : (
              accessories.map(acc => (
                <tr key={acc.id} className="hover:bg-surface-1/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-1 border border-hairline relative">
                      {acc.photos?.[0] ? (
                        <Image src={acc.photos[0]} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-surface-2" />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-sans font-bold text-ink text-sm">
                    {acc.name}
                  </td>
                  <td className="px-5 py-4 font-body text-xs text-ink-muted">
                    {acc.category}
                  </td>
                  <td className="px-5 py-4 font-sans font-bold text-brand-primary text-sm">
                    {acc.price.toLocaleString('ar-EG')} ج.م
                  </td>
                  <td className="px-5 py-4 font-body text-sm text-ink">
                    {acc.quantity ?? 0}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        'inline-block px-2.5 py-0.5 rounded-full text-xs font-body',
                        acc.stockStatus === 'in_stock'
                          ? 'bg-green-100 text-green-700'
                          : acc.stockStatus === 'limited'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-600'
                      )}
                    >
                      {STOCK_LABELS[acc.stockStatus]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-end space-s-2">
                    <button
                      onClick={() => handleToggleVisible(acc)}
                      className="p-1.5 rounded-lg text-ink-muted hover:bg-surface-2 transition-colors"
                      title={acc.visible ? 'إخفاء' : 'إظهار'}
                    >
                      {acc.visible ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(acc)}
                      className="p-1.5 rounded-lg text-ink-muted hover:bg-surface-2 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(acc.id)}
                      disabled={deletingId === acc.id}
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
                {editingId ? 'تعديل الإكسسوار' : 'إكسسوار جديد'}
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
                <label className="block font-body text-xs text-ink-muted mb-1">اسم الإكسسوار *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="مثال: ماوس جيمنج RGB لاسلكي"
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
                  <input
                    type="text"
                    list="category-list"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="اختر أو اكتب فئة"
                    className="w-full px-3 py-2 border border-hairline rounded-xl font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                  />
                  <datalist id="category-list">
                    {CATEGORY_SUGGESTIONS.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
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
                <label className="block font-body text-xs text-ink-muted mb-1">الوصف والتفاصيل</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-hairline rounded-xl font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                />
              </div>

              {/* Upload photos */}
              <div>
                <label className="block font-body text-xs text-ink-muted mb-1">صور المنتج</label>
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
                  {isUploading ? 'جاري الرفع...' : 'رفع صور الإكسسوار'}
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
