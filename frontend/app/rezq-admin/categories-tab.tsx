'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Pencil, Loader2, Upload, X, LayoutGrid } from 'lucide-react'
import { api } from '@/lib/api'
import type { CategoryRecord } from '@/lib/types'
import { useUploadThing } from '@/lib/uploadthing'

function CategoryEditModal({
  category,
  onClose,
  onSaved,
}: {
  category: CategoryRecord
  onClose: () => void
  onSaved: (updated: CategoryRecord) => void
}) {
  const [name, setName] = useState(category.name)
  const [image, setImage] = useState(category.image || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { startUpload, isUploading } = useUploadThing('categoryImages', {
    onClientUploadComplete: res => {
      const url = (res ?? [])[0] as { ufsUrl?: string; url?: string } | undefined
      if (url) setImage(url.ufsUrl ?? url.url ?? '')
    },
    onUploadError: () => setError('تعذر رفع الصورة. تأكد من الإعدادات.'),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('اسم الفئة مطلوب')

    setSaving(true)
    setError(null)
    try {
      const updated = await api.update_category(category.slug, {
        name: name.trim(),
        image: image.trim() || null,
      })
      onSaved(updated)
      onClose()
    } catch {
      setError('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-canvas border border-hairline shadow-2xl p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-sans font-extrabold text-lg text-ink">تعديل الفئة</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors">
            <X className="w-5 h-5 text-ink-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-body text-sm font-semibold text-ink">اسم الفئة</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-xl border border-hairline px-3.5 py-2.5 font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>

          <div className="space-y-2">
            <label className="font-body text-sm font-semibold text-ink">صورة الفئة (صورة منتج حقيقية)</label>

            {image && (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-hairline">
                <Image src={image} alt={name} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setImage('')}
                  className="absolute top-2 left-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="url"
                value={image}
                onChange={e => setImage(e.target.value)}
                placeholder="رابط صورة مباشر (URL)..."
                className="flex-1 rounded-xl border border-hairline px-3 py-2 text-xs font-sans bg-canvas focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-hairline rounded-xl p-4 cursor-pointer hover:border-brand-primary/50 transition-colors">
              {isUploading ? (
                <div className="flex items-center gap-2 text-xs text-brand-primary font-bold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري رفع الصورة...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <Upload className="w-4 h-4" />
                  <span>أو انقر لرفع صورة من الجهاز (الحد الأقصى 2MB)</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async e => {
                  const files = Array.from(e.target.files || [])
                  const validFiles = files.filter(f => f.size <= 2 * 1024 * 1024)
                  if (validFiles.length < files.length) {
                    alert('حجم الصورة يتجاوز 2 ميجابايت.')
                  }
                  if (validFiles.length > 0) {
                    await startUpload(validFiles)
                  }
                }}
              />
            </label>
          </div>

          {error && <p className="text-xs text-red-500 font-body">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-hairline py-2.5 font-sans font-bold text-sm text-ink hover:bg-surface-2 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-brand-primary py-2.5 font-sans font-bold text-sm text-white hover:brightness-110 transition-all disabled:opacity-60"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CategoriesTab() {
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<CategoryRecord | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await api.get_categories()
      setCategories(Array.isArray(data) ? [...data].sort((a, b) => a.order - b.order) : [])
    } catch {
      // keep whatever we had
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleSaved = (updated: CategoryRecord) => {
    setCategories(prev => prev.map(c => (c.slug === updated.slug ? updated : c)))
    setFeedback('تم تحديث الفئة بنجاح')
    setTimeout(() => setFeedback(null), 2500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary">
          <LayoutGrid className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-sans font-extrabold text-xl text-ink">فئات الصفحة الرئيسية (Categories)</h2>
          <p className="font-body text-sm text-ink-muted">
            ارفع صورة منتج حقيقية لكل فئة من الـ 8 لتظهر في شريط الفئات بالصفحة الرئيسية بدل الأيقونة.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl bg-brand-primary/10 border border-brand-primary/30 px-4 py-2.5 text-sm font-body text-brand-primary">
          {feedback}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-ink-muted">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map(category => (
            <div
              key={category.slug}
              className="group relative rounded-2xl border border-hairline overflow-hidden bg-surface-1 aspect-square"
            >
              {category.image ? (
                <Image src={category.image} alt={category.name} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-2 text-ink-muted text-xs font-body">
                  لا توجد صورة بعد
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute bottom-2 right-2 text-white font-sans font-bold text-sm">
                {category.name}
              </span>
              <button
                onClick={() => setEditing(category)}
                className="absolute top-2 left-2 p-2 rounded-full bg-white/90 hover:bg-white text-ink shadow-md transition-colors"
                aria-label="تعديل الفئة"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <CategoryEditModal category={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
      )}
    </div>
  )
}
