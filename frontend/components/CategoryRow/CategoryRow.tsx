'use client'

import React from 'react'
import Link from 'next/link'
import { Boxes, Cpu, HardDrive, MousePointer2 } from 'lucide-react'
import type { CategoryQuickAccess } from '@/lib/types'
import { getCategoryHref } from '@/lib/category-routes'

export const DEFAULT_CATEGORIES: CategoryQuickAccess[] = [
  {
    id: 'cat-accessories',
    name: 'إكسسوارات',
    slug: 'accessories',
    sectionKey: 'accessories',
    iconImage:
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=240&q=80',
  },
  {
    id: 'cat-batteries',
    name: 'بطاريات وشاشات',
    slug: 'batteries',
    sectionKey: 'batteries',
    iconImage:
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=240&q=80',
  },
  {
    id: 'cat-storage',
    name: 'تخزين ورام',
    slug: 'storage',
    sectionKey: 'storage',
    iconImage:
      'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=240&q=80',
  },
]

interface CategoryRowProps {
  categories?: CategoryQuickAccess[]
}

export default function CategoryRow({
  categories = DEFAULT_CATEGORIES,
}: CategoryRowProps) {
  return (
    <section className="relative w-full overflow-hidden bg-[#071414] py-8 sm:py-10 transition-colors duration-200">
      <div className="pointer-events-none absolute -left-20 top-1/2 size-64 -translate-y-1/2 rounded-full bg-brand-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-0 size-56 rounded-full bg-brand-accent/10 blur-3xl" />
      <div className="relative w-[92vw] max-w-none mx-auto">
        <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
          <span className="font-body text-xs font-bold tracking-[0.2em] text-brand-primary uppercase">اكتشف تشكيلتنا</span>
          <span className="h-px w-20 bg-gradient-to-l from-brand-primary to-transparent sm:w-40" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
          {categories.map((cat, idx) => {
            const Icon = cat.slug === 'storage' ? HardDrive : cat.slug === 'accessories' ? MousePointer2 : Boxes
            return (
              <Link
                key={cat.id}
                href={getCategoryHref(cat.slug)}
                style={{ animationDelay: `${idx * 100}ms` }}
                className="group animate-count relative flex min-h-32 items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-right shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/60 hover:bg-brand-primary/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <div className="absolute -right-8 -top-8 size-24 rounded-full bg-brand-primary/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
                <div className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl border border-brand-primary/30 bg-gradient-to-br from-brand-primary/20 to-transparent text-brand-primary shadow-inner transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                  <Icon className="size-8" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div className="relative flex flex-1 flex-col gap-1">
                  <span className="font-sans text-lg font-extrabold text-white transition-colors group-hover:text-brand-primary">{cat.name}</span>
                  <span className="font-body text-xs text-white/45">تصفح المنتجات المتاحة</span>
                </div>
                <span className="relative text-xl text-brand-primary/60 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true">←</span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
