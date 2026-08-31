'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  CheckCircle2,
  XCircle,
  Eye,
  CreditCard,
  Phone,
  MapPin,
  Clock,
  X,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import type { Order } from '@/lib/types'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  vodafone_cash: 'فودافون كاش',
  instapay: 'إنستا باي',
}

export default function PaymentsTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const fetchPendingPayments = async () => {
    try {
      setLoading(true)
      const res = await api.get_orders(undefined, 1, 100, 'pending_verification')
      const items = Array.isArray(res) ? res : res?.items || []
      setOrders(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل طلبات مراجعة الدفع')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingPayments()
  }, [])

  const handleVerifyPayment = async (orderId: string, status: 'confirmed' | 'rejected') => {
    const actionLabel = status === 'confirmed' ? 'تأكيد' : 'رفض'
    if (!confirm(`هل أنت تأكد من ${actionLabel} استلام الدفع لهذا الطلب؟`)) return

    setActionId(orderId)
    try {
      await api.update_payment_status(orderId, status)
      setOrders(prev => prev.filter(o => o.id !== orderId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل تحديث حالة الدفع')
    } finally {
      setActionId(null)
    }
  }

  if (loading && orders.length === 0)
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-sans font-bold text-ink text-2xl">مراجعة المدفوعات (Pending Verification)</h2>
          <p className="font-body text-sm text-ink-muted">
            مراجعة صور إيصالات تحويل فودافون كاش / إنستا باي وتأكيد استلام المبلغ أو رفضه
          </p>
        </div>
      </div>

      {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>}

      {orders.length === 0 ? (
        <div className="bg-canvas border border-hairline rounded-[20px] p-12 text-center text-ink-muted">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-sans font-bold text-ink text-lg mb-1">لا توجد مدفوعات معلقة</h3>
          <p className="font-body text-sm text-ink-muted">جميع الطلبات الحالية تمت مراجعة إيصالات دفعها.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map(order => (
            <div
              key={order.id}
              className="bg-canvas border border-hairline rounded-[24px] p-6 shadow-sm flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-hairline mb-4">
                  <div>
                    <span className="font-sans font-bold text-brand-primary text-base">
                      {order.orderNumber || order.id}
                    </span>
                    <p className="font-body text-xs text-ink-muted">{order.customerName}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-body font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    قيد المراجعة
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {/* Receipt Photo */}
                  <div>
                    <p className="font-body text-xs text-ink-muted mb-2 font-semibold">صورة الإيصال المرفقة:</p>
                    {order.depositPhotoUrl ? (
                      <div
                        onClick={() => setSelectedPhoto(order.depositPhotoUrl!)}
                        className="relative w-full h-36 rounded-xl overflow-hidden border border-hairline bg-surface-1 cursor-pointer group"
                      >
                        <Image
                          src={order.depositPhotoUrl}
                          alt="إيصال الدفع"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-body gap-1">
                          <Eye className="w-4 h-4" />
                          تكبير الصورة
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-36 rounded-xl border border-dashed border-hairline bg-surface-1 flex items-center justify-center text-ink-muted text-xs font-body">
                        لم ترفق صورة إيصال
                      </div>
                    )}
                  </div>

                  {/* Customer details */}
                  <div className="space-y-2 text-xs font-body">
                    <div>
                      <span className="text-ink-muted">طريقة الدفع:</span>{' '}
                      <strong className="text-ink">
                        {PAYMENT_METHOD_LABELS[order.paymentMethod || ''] || order.paymentMethod || 'غير محدد'}
                      </strong>
                      {order.isCashOnDelivery && (
                        <span className="mr-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-body font-semibold">
                          دفع عند الاستلام
                        </span>
                      )}
                    </div>
                    {order.isCashOnDelivery && (
                      <div>
                        <span className="text-ink-muted">مبلغ التأمين:</span>{' '}
                        <strong className="text-brand-primary font-sans text-sm">
                          {order.depositAmount?.toLocaleString('ar-EG') || 0} ج.م
                        </strong>
                        <span className="text-ink-muted text-[10px] block">
                          المتبقى للدفع عند الاستلام: {(order.total - (order.depositAmount || 0)).toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-ink-muted">الهاتف:</span>{' '}
                      <a href={`tel:${order.phone}`} className="text-brand-primary font-semibold hover:underline">
                        {order.phone}
                      </a>
                    </div>
                    <div>
                      <span className="text-ink-muted">إجمالي الطلب:</span>{' '}
                      <strong className="text-brand-primary font-sans text-sm">
                        {order.total.toLocaleString('ar-EG')} ج.م
                      </strong>
                    </div>
                    <div>
                      <span className="text-ink-muted">المنتجات:</span>
                      <ul className="mt-1 space-y-0.5 max-h-20 overflow-y-auto">
                        {order.items.map((i, idx) => (
                          <li key={idx} className="text-ink truncate">
                            • {i.name} (×{i.qty})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-hairline">
                <button
                  onClick={() => handleVerifyPayment(order.id, 'rejected')}
                  disabled={actionId === order.id}
                  className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-sans font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  رفض الدفع
                </button>
                <button
                  onClick={() => handleVerifyPayment(order.id, 'confirmed')}
                  disabled={actionId === order.id}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 font-sans font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  تأكيد الدفع خصم المخزون
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSelectedPhoto(null)} />
          <div className="relative bg-canvas p-2 rounded-2xl max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-2">
              <a
                href={selectedPhoto}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-body text-brand-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                فتح الصورة الأصلية
              </a>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-1 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative w-full h-[70vh]">
              <Image src={selectedPhoto} alt="إيصال الدفع" fill className="object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
