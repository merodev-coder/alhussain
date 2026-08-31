'use client'

import { useState, useEffect } from 'react'
import { Truck, Check, Loader2 } from 'lucide-react'
import type { ShippingRate } from '@/lib/types'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'

export default function ShippingTab() {
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingGov, setSavingGov] = useState<string | null>(null)
  const [successGov, setSuccessGov] = useState<string | null>(null)

  const fetchRates = async () => {
    try {
      setLoading(true)
      const res = await api.get_shipping_rates()
      setRates(res || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل أسعار الشحن')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRates()
  }, [])

  const handleUpdate = async (gov: string, patch: { cost?: number; estimatedDays?: number; active?: boolean }) => {
    setSavingGov(gov)
    try {
      const updated = await api.update_shipping_rate(gov, patch)
      setRates(prev => prev.map(r => (r.governorate === gov ? { ...r, ...updated } : r)))
      setSuccessGov(gov)
      setTimeout(() => setSuccessGov(null), 2000)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل التحديث')
    } finally {
      setSavingGov(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-sans font-bold text-ink text-2xl">إعدادات الشحن المحافظات</h2>
          <p className="font-body text-sm text-ink-muted">
            تحديد تكلفة الشحن ومدة التوصيل لجميع المحافظات المصرية (27 محافظة)
          </p>
        </div>
      </div>

      {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>}

      <div className="bg-canvas border border-hairline rounded-[20px] overflow-hidden shadow-sm">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="bg-surface-1 border-b border-hairline text-xs font-body font-semibold text-ink-muted">
              <th className="px-5 py-3 text-start">المحافظة</th>
              <th className="px-5 py-3 text-start">تكلفة الشحن (ج.م)</th>
              <th className="px-5 py-3 text-start">مدة التوصيل (أيام)</th>
              <th className="px-5 py-3 text-start">حالة الشحن</th>
              <th className="px-5 py-3 text-end">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {rates.map(rate => (
              <tr key={rate.governorate} className="hover:bg-surface-1/50 transition-colors">
                <td className="px-5 py-4 font-sans font-bold text-ink text-sm">
                  {rate.governorate}
                </td>
                <td className="px-5 py-4">
                  <input
                    type="number"
                    min="0"
                    value={rate.cost}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0
                      setRates(prev => prev.map(r => (r.governorate === rate.governorate ? { ...r, cost: val } : r)))
                    }}
                    className="w-28 px-3 py-1.5 border border-hairline rounded-xl font-sans font-bold text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                  />
                </td>
                <td className="px-5 py-4">
                  <input
                    type="number"
                    min="1"
                    value={rate.estimatedDays}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10) || 1
                      setRates(prev => prev.map(r => (r.governorate === rate.governorate ? { ...r, estimatedDays: val } : r)))
                    }}
                    className="w-24 px-3 py-1.5 border border-hairline rounded-xl font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                  />
                </td>
                <td className="px-5 py-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rate.active}
                      onChange={e => {
                        const active = e.target.checked
                        setRates(prev => prev.map(r => (r.governorate === rate.governorate ? { ...r, active } : r)))
                        handleUpdate(rate.governorate, { active })
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary" />
                    <span className="ms-2 font-body text-xs text-ink-muted">
                      {rate.active ? 'متاح للشحن' : 'غير متاح'}
                    </span>
                  </label>
                </td>
                <td className="px-5 py-4 text-end">
                  <button
                    onClick={() =>
                      handleUpdate(rate.governorate, {
                        cost: rate.cost,
                        estimatedDays: rate.estimatedDays,
                        active: rate.active,
                      })
                    }
                    disabled={savingGov === rate.governorate}
                    className={cn(
                      'px-3 py-1.5 rounded-xl font-sans font-bold text-xs transition-colors flex items-center gap-1.5 ms-auto',
                      successGov === rate.governorate
                        ? 'bg-green-500 text-white'
                        : 'bg-brand-primary text-white hover:bg-brand-primary/90'
                    )}
                  >
                    {savingGov === rate.governorate ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : successGov === rate.governorate ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        تم الحفظ
                      </>
                    ) : (
                      'حفظ'
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
