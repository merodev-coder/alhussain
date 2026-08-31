'use client'

import { useState, useEffect } from 'react'
import {
  Download,
  Filter,
  Pencil,
  AlertTriangle,
  History,
  X,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import type { InventoryItem, InventoryLog, StockStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'

const STOCK_LABELS: Record<StockStatus, string> = {
  in_stock: 'متوفر',
  limited: 'محدود (≤3)',
  out_of_stock: 'نفد (0)',
}

const CATEGORY_LABELS: Record<InventoryItem['category'], string> = {
  laptop: 'لابتوب',
  addon: 'إضافة',
  accessory: 'إكسسوار',
}

export default function InventoryTab() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [lowStockFilter, setLowStockFilter] = useState<boolean>(false)

  // Adjust dialog state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [newQty, setNewQty] = useState<string>('')
  const [newStatus, setNewStatus] = useState<StockStatus>('in_stock')
  const [reason, setReason] = useState<string>('')
  const [saving, setSaving] = useState(false)

  // Audit logs state
  const [logs, setLogs] = useState<InventoryLog[]>([])
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const data = await api.get_inventory(categoryFilter, lowStockFilter)
      setItems(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل بيانات الجرد')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [categoryFilter, lowStockFilter])

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItem(item)
    setNewQty(item.quantity.toString())
    setNewStatus(item.stockStatus)
    setReason('')
  }

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    const qtyNum = parseInt(newQty, 10)
    if (isNaN(qtyNum) || qtyNum < 0) return alert('الكمية غير صحيحة')
    if (!reason.trim()) return alert('يرجى ادخال سبب التعديل (سجل التدقيق)')

    setSaving(true)
    try {
      await api.adjust_inventory({
        itemType: selectedItem.category,
        itemId: selectedItem.id,
        quantity: qtyNum,
        reason: reason.trim(),
        stockStatus: newStatus,
      })
      setSelectedItem(null)
      fetchInventory()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل تعديل المخزون')
    } finally {
      setSaving(false)
    }
  }

  const handleFetchLogs = async () => {
    setShowLogsModal(true)
    setLogsLoading(true)
    try {
      const res = await api.get_inventory_logs()
      setLogs(res || [])
    } catch (err) {
      alert('فشل تحميل سجل التعديلات')
    } finally {
      setLogsLoading(false)
    }
  }

  const handleExportCSV = () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    window.open(`${backendUrl}/api/inventory/export.csv`, '_blank')
  }

  if (loading && items.length === 0)
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-sans font-bold text-ink text-2xl">نظام الجرد والمخزون</h2>
          <p className="font-body text-sm text-ink-muted">
            إدارة فورية للكميات وحالات التوفر لجميع المنتجات والإضافات والإكسسوارات
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleFetchLogs}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-hairline bg-canvas font-body text-sm hover:bg-surface-1 transition-colors"
          >
            <History className="w-4 h-4 text-ink-muted" />
            سجل الجرد
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white font-sans font-bold text-sm hover:bg-brand-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            تصدير CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-canvas border border-hairline p-4 rounded-[20px]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-ink-muted" />
          <span className="font-body text-xs font-semibold text-ink-muted">تصفية حسب:</span>
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 border border-hairline rounded-xl font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
        >
          <option value="all">جميع الفئات</option>
          <option value="laptop">اللابتوبات</option>
          <option value="addon">الإضافات</option>
          <option value="accessory">الإكسسوارات</option>
        </select>

        <label className="flex items-center gap-2 text-xs font-body text-ink cursor-pointer ms-auto">
          <input
            type="checkbox"
            checked={lowStockFilter}
            onChange={e => setLowStockFilter(e.target.checked)}
            className="rounded border-hairline text-brand-primary focus:ring-[#0FC7C1]"
          />
          <span className="flex items-center gap-1 text-amber-600 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            عرض المخزون المنخفض فقط (≤3)
          </span>
        </label>
      </div>

      {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>}

      {/* Table */}
      <div className="bg-canvas border border-hairline rounded-[20px] overflow-hidden shadow-sm">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="bg-surface-1 border-b border-hairline text-xs font-body font-semibold text-ink-muted">
              <th className="px-5 py-3 text-start">المنتج / الإضافة</th>
              <th className="px-5 py-3 text-start">النوع</th>
              <th className="px-5 py-3 text-start">الكمية الحالية</th>
              <th className="px-5 py-3 text-start">حالة التوفر</th>
              <th className="px-5 py-3 text-end">تعديل المخزون</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-ink-muted">
                  لا توجد عناصر مطابقة
                </td>
              </tr>
            ) : (
              items.map(item => (
                <tr key={`${item.category}-${item.id}`} className="hover:bg-surface-1/50 transition-colors">
                  <td className="px-5 py-4 font-sans font-bold text-ink text-sm">
                    {item.name}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-body text-xs px-2.5 py-1 rounded-md bg-surface-1 text-ink-muted">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-sans font-bold text-base text-ink">
                    <span className={cn(item.quantity <= 3 ? 'text-amber-600' : 'text-ink')}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        'inline-block px-2.5 py-0.5 rounded-full text-xs font-body',
                        item.stockStatus === 'in_stock'
                          ? 'bg-green-100 text-green-700'
                          : item.stockStatus === 'limited'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-600'
                      )}
                    >
                      {STOCK_LABELS[item.stockStatus]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-end">
                    <button
                      onClick={() => handleOpenAdjust(item)}
                      className="px-3 py-1.5 rounded-xl border border-hairline font-body text-xs text-ink hover:bg-surface-1 transition-colors inline-flex items-center gap-1"
                    >
                      <Pencil className="w-3.5 h-3.5 text-brand-primary" />
                      تعديل الكمية
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Adjust Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedItem(null)} />
          <div className="relative bg-canvas border border-hairline rounded-[24px] w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-hairline">
              <h3 className="font-sans font-bold text-ink text-lg">تعديل المخزون يدويًا</h3>
              <button onClick={() => setSelectedItem(null)} className="w-8 h-8 rounded-full hover:bg-surface-1 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="space-y-4">
              <div>
                <p className="font-sans font-bold text-sm text-ink mb-1">{selectedItem.name}</p>
                <p className="font-body text-xs text-ink-muted">النوع: {CATEGORY_LABELS[selectedItem.category]}</p>
              </div>

              <div>
                <label className="block font-body text-xs text-ink-muted mb-1">الكمية الجديدة *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newQty}
                  onChange={e => {
                    const q = e.target.value
                    setNewQty(q)
                    const qNum = parseInt(q, 10)
                    if (!isNaN(qNum)) {
                      setNewStatus(qNum <= 0 ? 'out_of_stock' : qNum <= 3 ? 'limited' : 'in_stock')
                    }
                  }}
                  className="w-full px-3 py-2 border border-hairline rounded-xl font-sans font-bold text-lg bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                />
              </div>

              <div>
                <label className="block font-body text-xs text-ink-muted mb-1">حالة التوفر</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as StockStatus)}
                  className="w-full px-3 py-2 border border-hairline rounded-xl font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                >
                  <option value="in_stock">متوفر</option>
                  <option value="limited">محدود</option>
                  <option value="out_of_stock">غير متوفر</option>
                </select>
              </div>

              <div>
                <label className="block font-body text-xs text-ink-muted mb-1">سبب التعديل (مطلوب لسجل التدقيق) *</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="مثال: جرد دفتري، استلام شحنة جديدة، بضاعة تالفة"
                  className="w-full px-3 py-2 border border-hairline rounded-xl font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 rounded-xl border border-hairline font-body text-sm hover:bg-surface-1"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-brand-primary text-white font-sans font-bold text-sm hover:bg-brand-primary/90 disabled:opacity-50"
                >
                  {saving ? 'جاري التعديل...' : 'تأكيد التعديل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowLogsModal(false)} />
          <div className="relative bg-canvas border border-hairline rounded-[24px] w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-hairline">
              <h3 className="font-sans font-bold text-ink text-lg">سجل جرد وتعديلات المخزون</h3>
              <button onClick={() => setShowLogsModal(false)} className="w-8 h-8 rounded-full hover:bg-surface-1 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            {logsLoading ? (
              <div className="py-8 text-center text-ink-muted">جاري تحميل السجل...</div>
            ) : logs.length === 0 ? (
              <div className="py-8 text-center text-ink-muted">لا يوجد سجل تعديلات يدوي بعد</div>
            ) : (
              <div className="space-y-3">
                {logs.map(log => (
                  <div key={log.id} className="p-3 bg-surface-1 rounded-xl border border-hairline flex flex-col gap-1 text-xs font-body">
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-bold text-ink text-sm">{log.itemName}</span>
                      <span className="text-ink-muted">{new Date(log.date).toLocaleString('ar-EG')}</span>
                    </div>
                    <div className="flex items-center gap-4 text-ink-muted">
                      <span>الكمية: <strong>{log.oldQty}</strong> ← <strong className="text-brand-primary">{log.newQty}</strong></span>
                      <span>المسؤول: <strong>{log.adminUser}</strong></span>
                    </div>
                    <p className="text-ink bg-canvas p-2 rounded border border-hairline mt-1">
                      السبب: {log.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
