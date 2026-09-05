'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import type { CategoryQuickAccess } from '@/lib/types'

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
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' })
    }
  }

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }

  const handleCategoryClick = (sectionKey: string) => {
    const element = document.getElementById(`section-${sectionKey}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.location.href = `/laptops?section=${sectionKey}`
    }
  }

  return (
    <section className="w-full bg-white dark:bg-[#0f0f0f] py-8 border-b border-gray-100 dark:border-gray-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Row Container with subtle scroll arrows on desktop */}
        <div className="relative group">
          {/* Right indicator / scroll arrow button on desktop (RTL: right is start) */}
          <button
            onClick={handleScrollRight}
            aria-label="تمرير لليمين"
            className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-md border border-gray-200 dark:border-gray-700 items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Horizontally scrollable list */}
          <div
            ref={scrollRef}
            className="flex items-center justify-start sm:justify-center gap-3 sm:gap-6 overflow-x-auto py-2 px-1 scroll-smooth no-scrollbar"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.sectionKey)}
                className="shrink-0 w-[110px] h-[110px] sm:w-[140px] sm:h-[140px] rounded-2xl bg-white dark:bg-[#1e1e2e] border-[1.5px] border-[#93c5fd] dark:border-blue-900/60 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 flex flex-col items-center justify-between p-2.5 sm:p-3.5 cursor-pointer text-center group/card focus:outline-none"
              >
                {/* Upper 70%: Category Image */}
                <div className="w-full h-[68%] relative rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
                  <Image
                    src={cat.iconImage}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 110px, 140px"
                    className="object-cover group-hover/card:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Bottom 30%: Category Name in Blue */}
                <span className="font-sans font-bold text-xs sm:text-sm text-[#3b82f6] dark:text-blue-400 truncate w-full pt-1">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>

          {/* Left scroll arrow button on desktop */}
          <button
            onClick={handleScrollLeft}
            aria-label="تمرير لليسار"
            className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-md border border-gray-200 dark:border-gray-700 items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
