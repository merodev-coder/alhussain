'use client'

import Link from 'next/link'
import {
  BatteryCharging,
  BriefcaseBusiness,
  HardDrive,
  LaptopMinimal,
  Mouse,
  type LucideIcon,
} from 'lucide-react'
import type { CategoryQuickAccess } from '@/lib/types'
import { getCategoryHref } from '@/lib/category-routes'

export const DEFAULT_CATEGORIES: CategoryQuickAccess[] = [
  { id: 'graphics', name: 'لابتوبات جرافيك', slug: 'graphics', sectionKey: 'graphics', icon: LaptopMinimal },
  { id: 'business', name: 'لابتوبات بزنس', slug: 'business', sectionKey: 'business', icon: BriefcaseBusiness },
  { id: 'accessories', name: 'إكسسوارات', slug: 'accessories', sectionKey: 'accessories', icon: Mouse },
  { id: 'batteries', name: 'بطاريات وشاشات', slug: 'batteries', sectionKey: 'batteries', icon: BatteryCharging },
  { id: 'storage', name: 'تخزين ورام', slug: 'storage', sectionKey: 'storage', icon: HardDrive },
]

interface CategoryRowProps {
  categories?: CategoryQuickAccess[]
}

export default function CategoryRow({ categories = DEFAULT_CATEGORIES }: CategoryRowProps) {
  return (
    <section className="w-full bg-canvas py-8 sm:py-12" aria-label="تصفح الأقسام">
      <div className="mx-auto w-[90%] max-w-7xl">
        <div className="category-dock grid grid-cols-2 gap-2.5 p-2.5 sm:grid-cols-3 sm:gap-3 sm:p-3 lg:grid-cols-5">
          {categories.map((category, index) => {
            const Icon = category.icon
            return (
              <Link
                key={category.id}
                href={getCategoryHref(category.slug)}
                style={{ animationDelay: `${index * 90}ms` }}
                className="category-tile group flex min-h-28 flex-col items-center justify-center gap-3 px-3 py-5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:min-h-36 sm:gap-4"
              >
                <span className="category-icon flex size-12 items-center justify-center rounded-[1.25rem] bg-brand-primary/10 text-brand-primary transition-all duration-300 group-hover:rotate-6 group-hover:bg-brand-primary group-hover:text-primary-foreground sm:size-14">
                  <Icon aria-hidden="true" strokeWidth={1.7} className="size-6 sm:size-7" />
                </span>
                <span className="font-sans text-sm font-bold text-ink transition-colors duration-300 group-hover:text-brand-primary sm:text-base">
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
