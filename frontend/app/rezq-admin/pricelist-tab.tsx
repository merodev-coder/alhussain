'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import {
  RefreshCw,
  Search,
  Printer,
  Pencil,
  ImageOff,
  Info,
} from 'lucide-react'
import api from '@/lib/api'
import { clientLogger } from '@/lib/client-logger'

interface LiveLaptopItem {
  id: string
  name: string
  price: number
  photo: string | null
  cpu: string
  ram: string
  storage: string
  gpu: string
  screen: string
  stockStatus?: string
}

export default function PricelistTab({ onGoToProducts }: { onGoToProducts?: () => void }) {
  const [items, setItems] = useState<LiveLaptopItem[]>([])
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchList = async () => {
    setLoading(true)
    try {
      const data = await api.get_pricelist_live()
      setItems(data?.items || [])
      setUpdatedAt(data?.updatedAt || null)
    } catch (err) {
      clientLogger.error('Failed to load live pricelist:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter(item => {
      const text = `${item.name} ${item.cpu || ''} ${item.gpu || ''} ${item.ram || ''} ${item.storage || ''}`.toLowerCase()
      return text.includes(term)
    })
  }, [items, search])

  const handlePrint = () => {
    // Opens the public pricelist page in a new tab so the printed PDF matches
    // exactly what customers see, with the nice thumbnails and large layout.
    window.open('/pricelist', '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-sans font-bold text-ink text-2xl mb-2">قائمة الأسعار</h2>
        <p className="font-body text-sm text-ink-muted leading-relaxed">
          هذه القائمة تُبنى تلقائياً من كل جهاز لابتوب <strong>ظاهر</strong> في المتجر (تم تفعيله ووضعه ضمن قسم اللابتوبات).
          لتعديل أو إضافة أو إخفاء جهاز، استخدم تاب <strong>المنتجات</strong> — أي تغيير هناك يظهر هنا وفي صفحة قائمة الأسعار العامة فوراً.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl text-ink">
        <Info className="w-5 h-5 shrink-0 mt-0.5 text-brand-primary" />
        <div className="flex-1 font-body text-sm leading-relaxed">
          الصورة المعروضة لكل جهاز هنا هي <strong>الصورة الأساسية</strong> المحددة له في تاب المنتجات (أول صورة في ترتيب صور الجهاز).
          لتغييرها، افتح الجهاز من تاب المنتجات واستخدم زر "اجعلها الصورة الأساسية".
        </div>
        {onGoToProducts && (
          <button
            onClick={onGoToProducts}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white hover:bg-brand-primary/90 rounded-lg text-xs font-semibold shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            الذهاب لتاب المنتجات
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو المعالج أو كارت الشاشة..."
            className="w-full h-10 pr-9 pl-4 rounded-xl bg-canvas border border-hairline text-sm text-ink placeholder-ink-muted focus:border-brand-primary outline-none transition-all"
          />
          <Search className="w-4 h-4 text-ink-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <button
          onClick={fetchList}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-surface-1 text-ink hover:bg-surface-2 border border-hairline rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>

        <button
          onClick={handlePrint}
          disabled={items.length === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-primary text-white hover:bg-brand-primary/90 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <Printer className="w-4 h-4" />
          فتح صفحة القائمة للطباعة / PDF
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-8 text-center bg-canvas border border-hairline rounded-[20px]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-primary mb-2" />
          <p className="font-body text-sm text-ink-muted">جاري تحميل قائمة الأسعار...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-canvas border border-hairline rounded-[20px] p-8 text-center text-ink-muted">
          <p className="font-body text-sm">
            لا توجد أجهزة لابتوب ظاهرة حالياً. أضف جهازاً من تاب المنتجات واجعل قسمه الرئيسي "لابتوبات" وفعّله ليظهر هنا.
          </p>
        </div>
      ) : (
        <div className="bg-canvas border border-hairline rounded-[20px] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
            <h3 className="font-sans font-bold text-ink text-lg">
              الأجهزة الظاهرة في القائمة ({filteredItems.length})
            </h3>
            {updatedAt && (
              <p className="font-body text-xs text-ink-muted">
                آخر تحديث: {new Date(updatedAt).toLocaleString('ar-EG')}
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-surface-2 text-ink font-semibold text-xs border-b border-hairline">
                  <th className="p-3 w-16 text-center">الصورة</th>
                  <th className="p-3 min-w-[180px]">اسم الجهاز</th>
                  <th className="p-3 min-w-[140px]">المعالج</th>
                  <th className="p-3 min-w-[90px]">الرام</th>
                  <th className="p-3 min-w-[110px]">التخزين</th>
                  <th className="p-3 min-w-[130px]">كارت الشاشة</th>
                  <th className="p-3 min-w-[100px]">السعر (ج.م)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline font-body">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-surface-1/70 transition-colors">
                    <td className="p-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-hairline bg-surface-1 flex items-center justify-center mx-auto">
                        {item.photo ? (
                          <Image src={item.photo} alt={item.name} width={48} height={48} className="w-full h-full object-cover" />
                        ) : (
                          <ImageOff className="w-5 h-5 text-ink-muted" />
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-ink">{item.name}</td>
                    <td className="p-3 text-ink text-xs">{item.cpu || '-'}</td>
                    <td className="p-3 text-ink text-xs whitespace-nowrap">{item.ram || '-'}</td>
                    <td className="p-3 text-ink text-xs whitespace-nowrap">{item.storage || '-'}</td>
                    <td className="p-3 text-ink-muted text-xs">{item.gpu || '-'}</td>
                    <td className="p-3 font-bold text-brand-primary whitespace-nowrap font-mono">
                      {Number(item.price || 0).toLocaleString('ar-EG')} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
