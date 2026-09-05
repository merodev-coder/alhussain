'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Plus,
  Trash2,
  Pencil,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Upload,
  Loader2,
  X,
  ExternalLink,
  Sparkles,
  Layers,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { HeroSlide } from '@/lib/types'
import { useUploadThing } from '@/lib/uploadthing'
import HeroSlideText from '@/components/Hero/HeroSlideText'
import HeroImageCarousel from '@/components/Hero/HeroImageCarousel'

export default function HeroSlidesTab() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const fetchSlides = async () => {
    try {
      setLoading(true)
      const data = await api.get_hero_slides()
      setSlides(data || [])
    } catch {
      // Fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlides()
  }, [])

  const handleToggleActive = async (slide: HeroSlide) => {
    const updatedStatus = !slide.isActive
    // Optimistic UI update
    setSlides(prev =>
      prev.map(s => (s.id === slide.id ? { ...s, isActive: updatedStatus } : s))
    )
    try {
      await api.update_hero_slide(slide.id, { isActive: updatedStatus })
      setFeedback('تم تحديث حالة الشريحة')
    } catch {
      fetchSlides()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشريحة؟')) return
    setSlides(prev => prev.filter(s => s.id !== id))
    try {
      await api.delete_hero_slide(id)
      setFeedback('تم حذف الشريحة بنجاح')
    } catch {
      fetchSlides()
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= slides.length) return

    const newSlides = [...slides]
    const [moved] = newSlides.splice(index, 1)
    newSlides.splice(targetIndex, 0, moved)

    // Optimistic UI update
    setSlides(newSlides)

    const ids = newSlides.map(s => s.id)
    try {
      await api.reorder_hero_slides(ids)
      setFeedback('تم حفظ الترتيب الجديد')
    } catch {
      fetchSlides()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-canvas border border-hairline p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-sans font-extrabold text-ink flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-primary" />
            <span>إدارة سلايدر الصفحة الرئيسية (Hero Slides)</span>
          </h2>
          <p className="text-xs text-ink-muted mt-1 font-body">
            أضف وعدّل شرائح العرض الرئيسية، الصور التفاعلية، ونصوص العروض الترويجية.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSlide(null)
            setIsModalOpen(true)
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white font-bold text-sm shadow hover:bg-brand-primary/90 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة شريحة جديدة</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs rounded-xl font-semibold border border-blue-200 dark:border-blue-800/50 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-sm">×</button>
        </div>
      )}

      {/* Slide Cards List */}
      {loading ? (
        <div className="p-12 text-center text-ink-muted flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
          <span>جاري تحميل الشرائح...</span>
        </div>
      ) : slides.length === 0 ? (
        <div className="bg-canvas border border-hairline rounded-2xl p-10 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-brand-primary mx-auto opacity-70" />
          <h3 className="font-bold text-ink text-base">لا توجد شرائح حالياً في قاعدة البيانات</h3>
          <p className="text-xs text-ink-muted max-w-md mx-auto font-body">
            يتم حالياً استخدام الشرائح الافتراضية المدمجة. انقر على &quot;إضافة شريحة جديدة&quot; لتخصيص محتوى السلايدر.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`bg-canvas border rounded-2xl p-4 sm:p-5 transition-all shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                slide.isActive ? 'border-hairline' : 'border-dashed border-gray-300 dark:border-gray-700 opacity-60'
              }`}
            >
              {/* Left Info: Images thumbnail + Text */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-20 h-16 sm:w-28 sm:h-20 relative rounded-xl overflow-hidden bg-surface-1 border border-hairline shrink-0">
                  {slide.images && slide.images.length > 0 ? (
                    <Image
                      src={slide.images[0]}
                      alt={slide.headline}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-ink-muted">
                      بدون صور
                    </div>
                  )}
                  {slide.images && slide.images.length > 1 && (
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                      {slide.images.length} صور
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-surface-2 text-ink text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="font-sans font-bold text-sm sm:text-base text-ink truncate">
                      {slide.headline}
                    </h3>
                  </div>
                  <p className="text-xs text-ink-muted truncate mt-1">
                    {slide.subtitle || 'بدون وصف فرعي'}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-ink-muted">
                    <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                      زر: {slide.buttonText}
                    </span>
                    <span>•</span>
                    <span>الرابط: {slide.buttonLink}</span>
                  </div>
                </div>
              </div>

              {/* Actions: Reorder, Active Toggle, Edit, Delete */}
              <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                {/* Reorder Buttons */}
                <button
                  onClick={() => handleMove(idx, 'up')}
                  disabled={idx === 0}
                  className="p-2 rounded-lg bg-surface-1 hover:bg-surface-2 disabled:opacity-30 transition-colors text-ink"
                  title="تحريك لأعلى"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMove(idx, 'down')}
                  disabled={idx === slides.length - 1}
                  className="p-2 rounded-lg bg-surface-1 hover:bg-surface-2 disabled:opacity-30 transition-colors text-ink"
                  title="تحريك لأسفل"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                {/* Active Toggle */}
                <button
                  onClick={() => handleToggleActive(slide)}
                  className={`p-2 rounded-lg transition-colors ${
                    slide.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                  }`}
                  title={slide.isActive ? 'تعطيل الشريحة' : 'تفعيل الشريحة'}
                >
                  {slide.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Edit */}
                <button
                  onClick={() => {
                    setEditingSlide(slide)
                    setIsModalOpen(true)
                  }}
                  className="p-2 rounded-lg bg-surface-1 hover:bg-surface-2 text-ink transition-colors"
                  title="تعديل الشريحة"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(slide.id)}
                  className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 transition-colors"
                  title="حذف الشريحة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Slide Modal */}
      {isModalOpen && (
        <SlideModal
          initial={editingSlide}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false)
            fetchSlides()
          }}
        />
      )}
    </div>
  )
}

function SlideModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: HeroSlide | null
  onClose: () => void
  onSaved: () => void
}) {
  const [headline, setHeadline] = useState(initial?.headline || '')
  const [subtitle, setSubtitle] = useState(initial?.subtitle || '')
  const [buttonText, setButtonText] = useState(initial?.buttonText || 'تصفح الآن')
  const [buttonColor, setButtonColor] = useState(initial?.buttonColor || '#2563eb')
  const [buttonLink, setButtonLink] = useState(initial?.buttonLink || '/laptops')
  const [badgeImage, setBadgeImage] = useState(initial?.badgeImage || '')
  const [images, setImages] = useState<string[]>(initial?.images || [])
  const [isActive, setIsActive] = useState(initial ? initial.isActive : true)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { startUpload, isUploading } = useUploadThing('heroImages', {
    onClientUploadComplete: res => {
      const urls = (res ?? []).map(r => (r as { ufsUrl?: string; url?: string }).ufsUrl ?? (r as { url: string }).url)
      setImages(prev => [...prev, ...urls.filter(Boolean)])
    },
    onUploadError: () => setError('تعذر رفع الصورة. تأكد من الإعدادات.'),
  })

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return
    setImages(prev => [...prev, newImageUrl.trim()])
    setNewImageUrl('')
  }

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!headline.trim()) return setError('العنوان الرئيسي مطلوب')
    if (images.length === 0) return setError('يرجى إضافة صورة واحدة على الأقل')

    setSaving(true)
    setError(null)

    const payload = {
      headline: headline.trim(),
      subtitle: subtitle.trim(),
      buttonText: buttonText.trim(),
      buttonColor: buttonColor.trim() || '#2563eb',
      buttonLink: buttonLink.trim() || '/laptops',
      badgeImage: badgeImage.trim() || null,
      images,
      isActive,
    }

    try {
      if (initial) {
        await api.update_hero_slide(initial.id, payload)
      } else {
        await api.create_hero_slide(payload)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  // Preview Slide Data
  const previewSlide: HeroSlide = {
    id: 'preview',
    headline: headline || 'عنوان تجريبي للشريحة',
    subtitle: subtitle || 'هذا نص وصفي تجريبي للشريحة لمعاينة شكل السلايدر قبل حفظه.',
    buttonText: buttonText || 'تصفح الآن',
    buttonColor: buttonColor || '#2563eb',
    buttonLink: buttonLink || '/laptops',
    badgeImage: badgeImage || null,
    images: images.length > 0 ? images : ['/logo.jpeg'],
    isActive: true,
    order: 1,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-canvas rounded-[24px] border border-hairline w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline sticky top-0 bg-canvas z-20">
          <h2 className="font-sans font-bold text-ink text-lg">
            {initial ? 'تعديل شريحة السلايدر' : 'إضافة شريحة سلايدر جديدة'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                previewMode
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-surface-1 text-ink border-hairline hover:bg-surface-2'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{previewMode ? 'العودة للنموذج' : 'معاينة الشريحة'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-surface-1 flex items-center justify-center transition-colors text-ink"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {previewMode ? (
          /* Live Preview Box */
          <div className="p-6">
            <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-[#0d0d0d] p-6 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5">
                  <HeroSlideText slide={previewSlide} slideKey="preview" />
                </div>
                <div className="md:col-span-7 h-[320px]">
                  <HeroImageCarousel
                    images={previewSlide.images}
                    activeImageIndex={0}
                    onSelectImage={() => {}}
                    onPrevImage={() => {}}
                    onNextImage={() => {}}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Edit Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-body text-sm font-semibold text-ink">
                العنوان الرئيسي (Headline) *
              </label>
              <input
                type="text"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                placeholder="مثال: أقوى أجهزة اللاب توب الاستيراد في مصر"
                className="w-full rounded-xl border border-hairline px-3.5 py-2.5 font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-body text-sm font-semibold text-ink">
                الوصف الفرعي (Subtitle)
              </label>
              <textarea
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                rows={2}
                placeholder="وصف مختصر وموجز يوضح العرض أو الفئة المستهدفة..."
                className="w-full rounded-xl border border-hairline px-3.5 py-2.5 font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-body text-sm font-semibold text-ink">
                  نص الزر (CTA Text)
                </label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={e => setButtonText(e.target.value)}
                  placeholder="تصفح العروض"
                  className="w-full rounded-xl border border-hairline px-3 py-2 font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-body text-sm font-semibold text-ink">
                  رابط الزر (Link)
                </label>
                <input
                  type="text"
                  value={buttonLink}
                  onChange={e => setButtonLink(e.target.value)}
                  placeholder="/laptops?section=graphics"
                  className="w-full rounded-xl border border-hairline px-3 py-2 font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-body text-sm font-semibold text-ink">
                  لون الزر (Hex Color)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={buttonColor}
                    onChange={e => setButtonColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-hairline p-0.5 cursor-pointer bg-canvas"
                  />
                  <input
                    type="text"
                    value={buttonColor}
                    onChange={e => setButtonColor(e.target.value)}
                    className="flex-1 rounded-xl border border-hairline px-3 py-2 font-mono text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
              </div>
            </div>

            {/* Images Management */}
            <div className="space-y-3 pt-2">
              <label className="font-body text-sm font-semibold text-ink flex items-center justify-between">
                <span>صور الشريحة (كاروسيل الصور الأيمن) *</span>
                <span className="text-xs font-normal text-ink-muted">
                  {images.length} صور مضافة
                </span>
              </label>

              {/* Added Images Preview */}
              {images.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {images.map((src, i) => (
                    <div key={i} className="relative w-24 h-20 rounded-xl overflow-hidden border border-hairline bg-surface-1 group">
                      <Image
                        src={src}
                        alt={`صورة ${i + 1}`}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-1 left-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        title="حذف"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add image by URL or Upload */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  placeholder="رابط صورة مباشر (URL)..."
                  className="flex-1 rounded-xl border border-hairline px-3 py-2 text-xs font-sans bg-canvas focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-4 py-2 rounded-xl bg-surface-2 text-ink text-xs font-bold hover:bg-surface-1 border border-hairline transition-colors"
                >
                  إضافة الرابط
                </button>
              </div>

              {/* Upload via UploadThing */}
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-hairline rounded-xl p-4 cursor-pointer hover:border-brand-primary/50 transition-colors">
                {isUploading ? (
                  <div className="flex items-center gap-2 text-xs text-brand-primary font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري رفع الصور...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <Upload className="w-4 h-4" />
                    <span>أو انقر لرفع صور من الجهاز (الحد الأقصى 2MB لكل صورة)</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async e => {
                    const files = Array.from(e.target.files || [])
                    const validFiles = files.filter(f => f.size <= 2 * 1024 * 1024)
                    if (validFiles.length < files.length) {
                      alert('تم استبعاد بعض الملفات لأن حجمها يتجاوز 2 ميجابايت.')
                    }
                    if (validFiles.length > 0) {
                      await startUpload(validFiles)
                    }
                  }}
                />
              </label>
            </div>

            {/* Slide Status Active */}
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="slide-active"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded border-hairline accent-brand-primary"
              />
              <label htmlFor="slide-active" className="font-body text-sm font-semibold text-ink">
                تفعيل الشريحة (إظهارها في الصفحة الرئيسية)
              </label>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-hairline">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-hairline text-ink text-sm font-semibold hover:bg-surface-1 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold shadow hover:bg-brand-primary/90 transition-all flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{initial ? 'حفظ التعديلات' : 'إضافة الشريحة'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
