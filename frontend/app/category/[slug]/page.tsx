'use client'

import { use, useMemo, useState } from 'react'
import useSWR from 'swr'
import { notFound } from 'next/navigation'
import { PackageSearch, SlidersHorizontal } from 'lucide-react'
import StoreLayout from '@/components/store-layout'
import AccessoryCard from '@/components/accessory-card'
import { fetcher } from '@/lib/fetcher'
import type { Accessory } from '@/lib/types'
import { CATEGORY_PAGE_META, CATEGORY_PAGE_SLUGS, type CategoryPageSlug } from '@/lib/category-routes'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

function isCategorySlug(value: string): value is CategoryPageSlug {
  return (CATEGORY_PAGE_SLUGS as readonly string[]).includes(value)
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  if (!isCategorySlug(slug)) {
    notFound()
  }

  return <CategoryPageContent slug={slug} />
}

function CategoryPageContent({ slug }: { slug: CategoryPageSlug }) {
  const meta = CATEGORY_PAGE_META[slug]
  const [page, setPage] = useState(1)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all')

  const { data, isLoading } = useSWR<{ items: Accessory[]; total: number; page: number; pages: number }>(
    `/api/accessories?homeSection=${slug}&page=${page}&limit=24`,
    fetcher
  )

  const items = data?.items ?? []
  const totalPages = data?.pages || 1

  const subCategories = useMemo(() => {
    const set = new Set<string>()
    items.forEach(a => {
      if (a.category) set.add(a.category)
    })
    return Array.from(set)
  }, [items])

  const filtered = useMemo(() => {
    return items.filter(a => {
      if (!a.visible) return false
      if (selectedSubCategory !== 'all' && a.category !== selectedSubCategory) return false
      return true
    })
  }, [items, selectedSubCategory])

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-sans font-bold text-ink text-3xl">{meta.title}</h1>
          <p className="font-body text-ink-muted text-sm mt-1.5 max-w-2xl">{meta.description}</p>
        </div>

        {/* Sub-category pills */}
        {subCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <span className="flex items-center gap-1.5 font-body text-xs text-ink-muted me-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              تصفية:
            </span>
            <button
              onClick={() => setSelectedSubCategory('all')}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-body font-semibold transition-colors',
                selectedSubCategory === 'all'
                  ? 'bg-brand-primary text-white'
                  : 'bg-surface-1 text-ink-muted hover:bg-surface-2'
              )}
            >
              الكل
            </button>
            {subCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedSubCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-full text-xs font-body font-semibold transition-colors',
                  selectedSubCategory === cat
                    ? 'bg-brand-primary text-white'
                    : 'bg-surface-1 text-ink-muted hover:bg-surface-2'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="rounded-2xl border border-hairline p-4 space-y-3">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-9 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-1 flex items-center justify-center">
              <PackageSearch className="w-8 h-8 text-ink-muted" />
            </div>
            <h3 className="font-sans font-bold text-ink text-xl">
              {items.length === 0 ? 'لا توجد منتجات بعد في هذا القسم' : 'لا توجد نتائج مطابقة'}
            </h3>
            <p className="font-body text-ink-muted text-sm">سيتم إضافة المنتجات قريباً.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {filtered.map(item => (
                <AccessoryCard key={item.id} accessory={item} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-full border border-hairline font-body text-sm text-ink hover:bg-surface-1 disabled:opacity-50"
                >
                  السابق
                </button>
                <span className="font-body text-sm text-ink-muted">
                  الصفحة {page} من {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-full border border-hairline font-body text-sm text-ink hover:bg-surface-1 disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </StoreLayout>
  )
}
