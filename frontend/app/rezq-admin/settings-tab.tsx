'use client'

import { useState, useEffect } from 'react'
import { Settings, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsTab() {
  const [vodafoneCashNumber, setVodafoneCashNumber] = useState('')
  const [instapayNumber, setInstapayNumber] = useState('')
  const [activeUploadThingTokenIndex, setActiveUploadThingTokenIndex] = useState(0)
  const [senderEmail, setSenderEmail] = useState('')
  const [senderEmailAppPassword, setSenderEmailAppPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await api.get_settings()
      setVodafoneCashNumber(res.vodafoneCashNumber || '')
      setInstapayNumber(res.instapayNumber || '')
      setActiveUploadThingTokenIndex(res.activeUploadThingTokenIndex ?? 0)
      setSenderEmail(res.senderEmail || '')
      setSenderEmailAppPassword(res.senderEmailAppPassword || '')
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vodafoneCashNumber.trim() || !instapayNumber.trim()) {
      alert('يرجى ملء جميع الحقول')
      return
    }

    setSaving(true)
    try {
      await api.update_settings({
        vodafoneCashNumber: vodafoneCashNumber.trim(),
        instapayNumber: instapayNumber.trim(),
        activeUploadThingTokenIndex,
        senderEmail: senderEmail.trim(),
        senderEmailAppPassword: senderEmailAppPassword.replace(/\s/g, ''),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل الحفظ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-1/2" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-sans font-bold text-ink text-2xl">إعدادات المتجر</h2>
          <p className="font-body text-sm text-ink-muted">
            إعداد أرقام الدفع وإعدادات البريد الإلكتروني
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Payment Settings */}
        <div className="bg-canvas border border-hairline rounded-[20px] p-6 shadow-sm max-w-2xl">
          <h3 className="font-sans font-bold text-ink text-lg mb-4">إعدادات الدفع</h3>
          <div className="space-y-6">
            <div>
              <label className="block font-body text-xs text-ink-muted mb-2 font-semibold">
                رقم فودافون كاش
              </label>
              <input
                type="text"
                value={vodafoneCashNumber}
                onChange={e => setVodafoneCashNumber(e.target.value)}
                placeholder="مثال: 010xxxxxxxx"
                className="w-full px-4 py-3 border border-hairline rounded-xl font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                dir="ltr"
              />
              <p className="font-body text-[11px] text-ink-muted mt-1">
                هذا الرقم سيظهر للعملاء عند اختيار طريقة الدفع فودافون كاش
              </p>
            </div>

            <div>
              <label className="block font-body text-xs text-ink-muted mb-2 font-semibold">
                رقم إنستا باي
              </label>
              <input
                type="text"
                value={instapayNumber}
                onChange={e => setInstapayNumber(e.target.value)}
                placeholder="مثال: 010xxxxxxxx@instapay"
                className="w-full px-4 py-3 border border-hairline rounded-xl font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                dir="ltr"
              />
              <p className="font-body text-[11px] text-ink-muted mt-1">
                هذا الرقم سيظهر للعملاء عند اختيار طريقة الدفع إنستا باي
              </p>
            </div>

            <div>
              <label className="block font-body text-xs text-ink-muted mb-2 font-semibold">
                فهرس توكن UploadThing النشط (معلوماتي فقط)
              </label>
              <input
                type="number"
                value={activeUploadThingTokenIndex}
                onChange={e => setActiveUploadThingTokenIndex(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-3 border border-hairline rounded-xl font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                dir="ltr"
              />
              <p className="font-body text-[11px] text-ink-muted mt-1">
                هذا الحقل للمتابعة والتوثيق فقط. تغيير هذا الرقم لا يغير التوكن المستخدم فعلياً. لتغيير التوكن النشط، يجب تحديث متغير البيئة UPLOADTHING_TOKEN في backend/.env وإعادة تشغيل الخادم.
              </p>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-canvas border border-hairline rounded-[20px] p-6 shadow-sm max-w-2xl">
          <h3 className="font-sans font-bold text-ink text-lg mb-4">إعدادات البريد الإلكتروني</h3>
          <div className="space-y-6">
            <div>
              <label className="block font-body text-xs text-ink-muted mb-2 font-semibold">
                البريد الإلكتروني للمتجر (المرسل)
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={e => setSenderEmail(e.target.value)}
                placeholder="store@gmail.com"
                className="w-full px-4 py-3 border border-hairline rounded-xl font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                dir="ltr"
              />
              <p className="font-body text-[11px] text-ink-muted mt-1">
                هذا البريد سيُستخدم لإرسال إشعارات الطلبات للعملاء.
              </p>
            </div>

            <div>
              <label className="block font-body text-xs text-ink-muted mb-2 font-semibold">
                كلمة مرور التطبيق (16 حرف)
              </label>
              <input
                type="password"
                value={senderEmailAppPassword}
                onChange={e => setSenderEmailAppPassword(e.target.value)}
                placeholder="xxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 border border-hairline rounded-xl font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                dir="ltr"
              />
              <p className="font-body text-[11px] text-ink-muted mt-1">
                احصل عليها من إعدادات حساب Google &gt; كلمات مرور التطبيقات (App Passwords). أدخلها بدون مسافات.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-hairline max-w-2xl">
          <button
            type="submit"
            disabled={saving}
            className={cn(
              'px-6 py-2.5 rounded-xl font-sans font-bold text-sm transition-colors flex items-center gap-2',
              saved
                ? 'bg-green-500 text-white'
                : 'bg-brand-primary text-white hover:bg-brand-primary/90 disabled:opacity-50'
            )}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                تم الحفظ
              </>
            ) : (
              <>
                <Settings className="w-4 h-4" />
                حفظ الإعدادات
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
