'use client'

import { useState, useEffect } from 'react'
import { Settings, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsTab() {
  const [vodafoneCashNumber, setVodafoneCashNumber] = useState('')
  const [instapayNumber, setInstapayNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await api.get_settings()
      setVodafoneCashNumber(res.vodafoneCashNumber || '')
      setInstapayNumber(res.instapayNumber || '')
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
          <h2 className="font-sans font-bold text-ink text-2xl">إعدادات الدفع</h2>
          <p className="font-body text-sm text-ink-muted">
            إعداد أرقام فودافون كاش وإنستا باي للتحويلات البنكية
          </p>
        </div>
      </div>

      <div className="bg-canvas border border-hairline rounded-[20px] p-6 shadow-sm max-w-2xl">
        <form onSubmit={handleSave} className="space-y-6">
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

          <div className="flex justify-end pt-4 border-t border-hairline">
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
    </div>
  )
}
