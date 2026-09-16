'use client'

import Link from 'next/link'
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
import type { CategoryQuickAccess } from '@/lib/types'
import { getCategoryHref } from '@/lib/category-routes'
import { StaggerGroup, StaggerItem } from '@/components/home/stagger'

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

interface CategoryRowProps {
  categories?: CategoryQuickAccess[]
}

export default function CategoryRow({ categories = DEFAULT_CATEGORIES }: CategoryRowProps) {
  return (
    <section className="w-full bg-canvas py-8 sm:py-12" aria-label="تصفح الأقسام">
      <div className="mx-auto w-[90%] max-w-7xl">
        <StaggerGroup className="category-dock grid grid-cols-3 gap-2.5 p-2.5 sm:grid-cols-4 sm:gap-3 sm:p-3 lg:grid-cols-8">
          {categories.map(category => {
            const Icon: LucideIcon = category.icon
            return (
              <StaggerItem key={category.id}>
                <Link
                  href={getCategoryHref(category.slug)}
                  className="category-tile group flex min-h-24 flex-col items-center justify-center gap-2.5 px-2 py-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:min-h-32 sm:gap-3"
                >
                  <span className="category-icon flex size-11 items-center justify-center rounded-[1.1rem] bg-brand-primary/10 text-brand-primary transition-all duration-300 group-hover:rotate-6 group-hover:bg-brand-primary group-hover:text-primary-foreground sm:size-13">
                    <Icon aria-hidden="true" strokeWidth={1.7} className="size-5 sm:size-6" />
                  </span>
                  <span className="font-sans text-xs font-bold text-ink transition-colors duration-300 group-hover:text-brand-primary sm:text-sm">
                    {category.name}
                  </span>
                </Link>
              </StaggerItem>
            )
          })}
        </StaggerGroup>
      </div>
    </section>
  )
}
