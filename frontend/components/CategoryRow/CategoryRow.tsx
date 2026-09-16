'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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

  return (
    <section className="w-full bg-canvas py-8 sm:py-10" aria-label="تصفح الأقسام">
      <div className="mx-auto w-[90%] max-w-7xl">
        <div className="flex flex-wrap justify-center gap-5 sm:gap-6">
          {categories.map(category => {
            const Icon = ICON_BY_SLUG[category.slug] || Laptop
            return (
              <Link
                key={category.id}
                href={getCategoryHref(category.slug)}
                className="group flex w-[27%] sm:w-[22%] lg:w-[calc(12.5%-21px)] flex-col items-center focus-visible:outline-none"
              >
                <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-surface-1 border border-hairline transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:border-brand-primary/30">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 27vw, (max-width: 1024px) 22vw, 12vw"
                      className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary transition-all duration-300 group-hover:rotate-6 group-hover:bg-brand-primary group-hover:text-primary-foreground">
                        <Icon aria-hidden="true" strokeWidth={1.7} className="size-7 sm:size-8" />
                      </span>
                    </div>
                  )}
                </div>
                <span className="mt-3 font-sans text-xs sm:text-sm font-bold text-ink text-center leading-snug transition-colors duration-300 group-hover:text-brand-primary">
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
