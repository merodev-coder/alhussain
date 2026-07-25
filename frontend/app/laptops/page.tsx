'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { SlidersHorizontal, X, Loader2 } from 'lucide-react'
import StoreLayout from '@/components/store-layout'
import ProductCard from '@/components/product-card'
import { fetcher } from '@/lib/fetcher'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

type SpecType = 'cpu' | 'gpu' | 'ram' | 'storage'
type SpecGroups = Record<SpecType, { id: string; value: string }[]>

const STOCK_OPTIONS: { value: Product['stockStatus']; label: string }[] = [
  { value: 'in_stock', label: 'متوفر' },
  { value: 'limited', label: 'كمية محدودة' },
  { value: 'out_of_stock', label: 'غير متوفر' },
]

const PRICE_CEILING = 150000

function PillGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onToggle(opt)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-body font-medium transition-colors',
            selected.includes(opt)
              ? 'bg-brand-primary text-white'
              : 'bg-surface-1 text-ink-muted hover:bg-surface-2'
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-hairline pb-5 mb-5 last:border-b-0 last:mb-0 last:pb-0">
      <h4 className="font-sans font-bold text-sm text-ink mb-3">{title}</h4>
      {children}
    </div>
  )
}

export default function LaptopsPage() {
  const { data, isLoading } = useSWR<{ products: Product[] }>('/api/products', fetcher)
  const { data: specData } = useSWR<{ options: SpecGroups }>('/api/spec-options', fetcher)

  const products = data?.products ?? []
  const specs = specData?.options ?? { cpu: [], gpu: [], ram: [], storage: [] }

  const cpuOptions = specs.cpu.map(o => o.value)
  const gpuOptions = specs.gpu.map(o => o.value)
  const ramOptions = specs.ram.map(o => o.value)
  const storageOptions = specs.storage.map(o => o.value)

  const [cpuFilter, setCpuFilter] = useState<string[]>([])
  const [gpuFilter, setGpuFilter] = useState<string[]>([])
  const [ramFilter, setRamFilter] = useState<string[]>([])
  const [storageFilter, setStorageFilter] = useState<string[]>([])
  const [stockFilter, setStockFilter] = useState<string[]>([])
  const [priceMax, setPriceMax] = useState(PRICE_CEILING)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  const clearAll = () => {
    setCpuFilter([])
    setGpuFilter([])
    setRamFilter([])
    setStorageFilter([])
    setStockFilter([])
    setPriceMax(PRICE_CEILING)
  }

  const hasFilters =
    cpuFilter.length > 0 ||
    gpuFilter.length > 0 ||
    ramFilter.length > 0 ||
    storageFilter.length > 0 ||
    stockFilter.length > 0 ||
    priceMax < PRICE_CEILING

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (cpuFilter.length && !cpuFilter.some(c => p.cpu?.toLowerCase().includes(c.toLowerCase()))) return false
      if (gpuFilter.length && !gpuFilter.some(g => p.gpu?.toLowerCase().includes(g.toLowerCase()))) return false
      if (ramFilter.length && !ramFilter.some(r => p.ram?.toLowerCase().includes(r.toLowerCase()))) return false
      if (storageFilter.length && !storageFilter.some(s => p.storage?.toLowerCase().includes(s.toLowerCase()))) return false
      if (stockFilter.length && !stockFilter.includes(p.stockStatus)) return false
      if (p.price > priceMax) return false
      return true
    })
  }, [products, cpuFilter, gpuFilter, ramFilter, storageFilter, stockFilter, priceMax])

  const FiltersContent = (
    <div className="flex flex-col">
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 text-xs font-body text-red-500 hover:text-red-600 mb-4 w-fit"
        >
          <X className="w-3 h-3" />
          مسح الفلاتر
        </button>
      )}
      {cpuOptions.length > 0 && (
        <FilterSection title="المعالج (CPU)">
          <PillGroup options={cpuOptions} selected={cpuFilter} onToggle={v => toggle(cpuFilter, setCpuFilter, v)} />
        </FilterSection>
      )}
      {gpuOptions.length > 0 && (
        <FilterSection title="كارت الشاشة (GPU)">
          <PillGroup options={gpuOptions} selected={gpuFilter} onToggle={v => toggle(gpuFilter, setGpuFilter, v)} />
        </FilterSection>
      )}
      {ramOptions.length > 0 && (
        <FilterSection title="الرام (RAM)">
          <PillGroup options={ramOptions} selected={ramFilter} onToggle={v => toggle(ramFilter, setRamFilter, v)} />
        </FilterSection>
      )}
      {storageOptions.length > 0 && (
        <FilterSection title="التخزين (Storage)">
          <PillGroup options={storageOptions} selected={storageFilter} onToggle={v => toggle(storageFilter, setStorageFilter, v)} />
        </FilterSection>
      )}
      <FilterSection title="الحالة">
        <PillGroup
          options={STOCK_OPTIONS.map(s => s.label)}
          selected={STOCK_OPTIONS.filter(s => stockFilter.includes(s.value)).map(s => s.label)}
          onToggle={label => {
            const found = STOCK_OPTIONS.find(s => s.label === label)
            if (found) toggle(stockFilter, setStockFilter, found.value)
          }}
        />
      </FilterSection>
      <FilterSection title="الحد الأقصى للسعر">
        <div className="space-y-2">
          <input
            type="range"
            min={10000}
            max={PRICE_CEILING}
            step={5000}
            value={priceMax}
            onChange={e => setPriceMax(Number(e.target.value))}
            className="w-full accent-[#0FC7C1]"
          />
          <div className="flex justify-between font-body text-xs text-ink-muted">
            <span>10,000 ج.م</span>
            <span className="font-semibold text-brand-primary">{priceMax.toLocaleString('ar-EG')} ج.م</span>
          </div>
        </div>
      </FilterSection>
    </div>
  )

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-sans font-bold text-ink text-3xl">اللابتوبات</h1>
            <p className="font-body text-ink-muted text-sm mt-1">{filtered.length} منتج</p>
          </div>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-full border border-hairline bg-canvas font-body text-sm text-ink hover:bg-surface-1 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            الفلاتر
            {hasFilters && <span className="w-2 h-2 rounded-full bg-brand-primary" />}
          </button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar – desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-canvas border border-hairline rounded-[20px] p-5 sticky top-24">
              <h3 className="font-sans font-bold text-ink mb-5">الفلاتر</h3>
              {FiltersContent}
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-surface-1 flex items-center justify-center">
                  <SlidersHorizontal className="w-8 h-8 text-ink-muted" />
                </div>
                <h3 className="font-sans font-bold text-ink text-xl">
                  {products.length === 0 ? 'لا توجد منتجات بعد' : 'لا توجد نتائج مطابقة'}
                </h3>
                <p className="font-body text-ink-muted text-sm">
                  {products.length === 0
                    ? 'سيتم إضافة المنتجات قريباً.'
                    : 'جرب تغيير الفلاتر للحصول على نتائج أخرى.'}
                </p>
                {hasFilters && (
                  <button onClick={clearAll} className="font-body text-sm text-brand-primary hover:underline">
                    مسح الفلاتر
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter bottom sheet */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute bottom-0 start-0 end-0 bg-canvas rounded-t-[30px] p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-sans font-bold text-ink text-lg">الفلاتر</h3>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-2 rounded-full hover:bg-surface-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            {FiltersContent}
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full mt-6 py-3 rounded-full bg-brand-primary text-white font-sans font-bold"
            >
              عرض النتائج ({filtered.length})
            </button>
          </div>
        </div>
      )}
    </StoreLayout>
  )
}
