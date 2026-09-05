'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { CategoryQuickAccess } from '@/lib/types'
import { getCategoryHref } from '@/lib/category-routes'

export const DEFAULT_CATEGORIES: CategoryQuickAccess[] = [
  {
    id: 'cat-graphics',
    name: 'لابتوبات جرافيك',
    slug: 'graphics',
    sectionKey: 'graphics',
    iconImage:
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=240&q=80',
  },
  {
    id: 'cat-business',
    name: 'لابتوبات بزنس',
    slug: 'business',
    sectionKey: 'business',
    iconImage:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=240&q=80',
  },
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
    <section className="w-full bg-canvas py-10 sm:py-14 border-b border-hairline transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              href={getCategoryHref(cat.slug)}
              style={{ animationDelay: `${idx * 60}ms` }}
              className="animate-count rounded-2xl bg-canvas border border-hairline hover:border-brand-primary/50 shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-95 transition-all duration-200 flex flex-col items-center p-4 sm:p-5 cursor-pointer text-center group focus:outline-none"
            >
              {/* Category Image */}
              <div className="w-full aspect-square relative rounded-xl overflow-hidden bg-surface-1 mb-3">
                <Image
                  src={cat.iconImage}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Category Name */}
              <span className="font-sans font-bold text-sm sm:text-base text-ink group-hover:text-brand-primary transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
