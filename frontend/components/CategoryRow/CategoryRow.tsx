'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import {
  Laptop,
  Briefcase,
  Mouse,
  MemoryStick,
  HardDrive,
  BatteryCharging,
  Plug,
  Monitor,
  type LucideIcon,
} from 'lucide-react'
import type { CategoryQuickAccess, CategoryRecord } from '@/lib/types'
import { getCategoryHref } from '@/lib/category-routes'
import { api } from '@/lib/api'

// Icon fallback shown until the admin uploads a real photo for a category
// from the dashboard (Categories tab).
export const DEFAULT_CATEGORIES: CategoryQuickAccess[] = [
  { id: 'laptops', name: 'لابتوبات', slug: 'laptops', sectionKey: 'laptops', icon: Laptop },
  { id: 'bags', name: 'شنط', slug: 'bags', sectionKey: 'bags', icon: Briefcase },
  { id: 'mice', name: 'ماوسات', slug: 'mice', sectionKey: 'mice', icon: Mouse },
  { id: 'ram', name: 'رامات', slug: 'ram', sectionKey: 'ram', icon: MemoryStick },
  { id: 'storage', name: 'هاردات', slug: 'storage', sectionKey: 'storage', icon: HardDrive },
  { id: 'batteries', name: 'بطاريات', slug: 'batteries', sectionKey: 'batteries', icon: BatteryCharging },
  { id: 'chargers', name: 'شواحن', slug: 'chargers', sectionKey: 'chargers', icon: Plug },
  { id: 'monitors', name: 'شاشات', slug: 'monitors', sectionKey: 'monitors', icon: Monitor },
]

const ICON_BY_SLUG: Record<string, LucideIcon> = {
  laptops: Laptop,
  bags: Briefcase,
  mice: Mouse,
  ram: MemoryStick,
  storage: HardDrive,
  batteries: BatteryCharging,
  chargers: Plug,
  monitors: Monitor,
}

export default function CategoryRow() {
  const [records, setRecords] = useState<CategoryRecord[] | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    api
      .get_categories()
      .then(data => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setRecords([]))
  }, [])

  // While loading (or if the request failed), fall back to the default
  // name/icon set with no photo yet, so the row never disappears.
  const categories: CategoryRecord[] =
    records && records.length > 0
      ? [...records].sort((a, b) => a.order - b.order)
      : DEFAULT_CATEGORIES.map((c, idx) => ({ id: c.id, slug: c.slug as CategoryRecord['slug'], name: c.name, image: null, order: idx + 1 }))

  const scrollToIndex = useCallback((idx: number) => {
    const item = itemRefs.current[idx]
    if (!item) return
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [])

  const scrollByAmount = useCallback((direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const amount = track.clientWidth * 0.7 * direction
    track.scrollBy({ left: amount, behavior: 'smooth' })
  }, [])

  return (
    <section className="w-full bg-canvas py-8 sm:py-10" aria-label="تصفح الأقسام">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative group/categories">
          <div
            ref={trackRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory no-scrollbar pb-1"
            role="region"
            aria-label="الفئات"
          >
            {categories.map((category, idx) => {
              const Icon = ICON_BY_SLUG[category.slug] || Laptop
              return (
                <Link
                  key={category.id}
                  href={getCategoryHref(category.slug)}
                  ref={el => {
                    itemRefs.current[idx] = el as unknown as HTMLDivElement
                  }}
                  className="group snap-start shrink-0 w-[38%] sm:w-[22%] lg:w-[calc(11.11%-18px)] flex flex-col items-center focus-visible:outline-none"
                >
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-surface-1 border border-hairline transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:border-brand-primary/30">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="(max-width: 640px) 38vw, (max-width: 1024px) 22vw, 11vw"
                        className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary transition-all duration-300 group-hover:rotate-6 group-hover:bg-brand-primary group-hover:text-primary-foreground">
                          <Icon aria-hidden="true" strokeWidth={1.7} className="size-6 sm:size-7" />
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="mt-2.5 font-sans text-xs sm:text-sm font-bold text-ink text-center leading-snug transition-colors duration-300 group-hover:text-brand-primary">
                    {category.name}
                  </span>
                </Link>
              )
            })}
          </div>

          {categories.length > 4 && (
            <>
              <button
                onClick={() => scrollByAmount(1)}
                aria-label="التالي"
                className="hidden sm:flex absolute -right-3 sm:-right-4 top-[38%] -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-canvas border border-hairline shadow-lg items-center justify-center text-ink hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-200 opacity-0 group-hover/categories:opacity-100 focus:outline-none"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => scrollByAmount(-1)}
                aria-label="السابق"
                className="hidden sm:flex absolute -left-3 sm:-left-4 top-[38%] -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-canvas border border-hairline shadow-lg items-center justify-center text-ink hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-200 opacity-0 group-hover/categories:opacity-100 focus:outline-none"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
