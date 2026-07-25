'use client'

import { useState, useEffect } from 'react'
import { Info, RefreshCw } from 'lucide-react'
import StoreLayout from '@/components/store-layout'
import api from '@/lib/api'

export default function PricelistPage() {
  const [priceList, setPriceList] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchPriceList = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await api.get_pricelist()
        setPriceList(data)
      } catch (err) {
        console.error('[v0] Failed to fetch pricelist:', err)
        setError(err instanceof Error ? err.message : 'فشل تحميل قائمة الأسعار')
        setPriceList(null)
      } finally {
        setLoading(false)
      }
    }
    fetchPriceList()
  }, [])

  return (
    <StoreLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-sans font-extrabold text-ink text-4xl mb-3">قائمة الأسعار</h1>
          <p className="font-body text-ink-muted text-lg max-w-xl mx-auto">
            أسعار جميع الموديلات المتوفرة بشفافية تامة — نحدّث القائمة أولاً بأول.
          </p>
        </div>

        {/* Notice banner */}
        <div className="flex items-start gap-3 bg-surface-2 border border-brand-primary/20 rounded-[20px] p-4 mb-8">
          <RefreshCw className="w-5 h-5 text-brand-primary mt-0.5 shrink-0" />
          <p className="font-body text-sm text-ink-muted leading-relaxed">
            يتم تحديث قائمة الأسعار بصفة دورية تبعاً لتغيرات السوق وأسعار الصرف. للتأكد من آخر الأسعار، تواصل معنا مباشرة.
          </p>
        </div>

        {/* Table */}
        {loading && (
          <div className="text-center py-12">
            <p className="font-body text-ink-muted">جاري تحميل قائمة الأسعار...</p>
          </div>
        )}

        {error && error.includes('لا توجد قائمة أسعار') ? (
          <div className="text-center py-12">
            <div className="bg-surface-2 border border-hairline rounded-xl p-8 inline-block">
              <p className="font-body text-ink-muted mb-2">قائمة الأسعار غير متوفرة حالياً</p>
              <p className="font-body text-sm text-ink-muted">
                يرجى التواصل معنا للحصول على آخر الأسعار
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-300 rounded-xl p-4 text-center mb-8">
            <p className="font-body text-red-700 mb-4">{error}</p>
            <button
              onClick={() => {
                setLoading(true)
                setError('')
                api.get_pricelist()
                  .then(data => setPriceList(data))
                  .catch(err => {
                    console.error('[v0] Retry failed:', err)
                    setError(err instanceof Error ? err.message : 'فشل تحميل قائمة الأسعار')
                  })
                  .finally(() => setLoading(false))
              }}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg font-body text-sm hover:bg-brand-primary/90 transition-colors"
            >
              إعادة محاولة
            </button>
          </div>
        ) : null}

        {!loading && !error && priceList && priceList.parsedHtml && (
          <div className="bg-canvas border border-hairline rounded-[20px] overflow-hidden p-6">
            <style>{`
              .pricelist-content table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 1rem;
              }
              .pricelist-content th,
              .pricelist-content td {
                border: 1px solid var(--hairline-color, #e0e0e0);
                padding: 0.75rem;
                text-align: right;
              }
              .pricelist-content th {
                background-color: var(--surface-color, #f5f5f5);
                font-weight: 600;
              }
              .pricelist-content td {
                background-color: #fff;
              }
              .pricelist-content tr:hover td {
                background-color: var(--surface-1, #fafafa);
              }
              .pricelist-content p {
                margin-bottom: 0.75rem;
                line-height: 1.6;
              }
            `}</style>
            <div
              className="pricelist-content font-body text-sm text-ink [&_table]:w-full [&_table]:border-collapse [&_th]:bg-surface-2 [&_th]:padding [&_th]:text-right [&_th]:font-semibold [&_td]:border [&_td]:border-hairline [&_td]:padding [&_td]:text-right"
              dangerouslySetInnerHTML={{ __html: priceList.parsedHtml }}
            />
            <p className="font-body text-xs text-ink-muted mt-4">
              آخر تحديث: {new Date(priceList.uploadedAt).toLocaleString('ar-EG')}
            </p>
          </div>
        )}

        {/* Footer note */}
        <div className="flex items-start gap-2 mt-6">
          <Info className="w-4 h-4 text-ink-muted mt-0.5 shrink-0" />
          <p className="font-body text-xs text-ink-muted leading-relaxed">
            الأسعار بالجنيه المصري وتشمل ضريبة القيمة المضافة. سعر الشحن يُحدد بناءً على المحافظة. جميع الأجهزة أصلية مع ضمان المصنع.
          </p>
        </div>
      </div>
    </StoreLayout>
  )
}
