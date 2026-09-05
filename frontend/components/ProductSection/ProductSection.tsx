'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronLeft, ArrowLeft } from 'lucide-react'
import type { Product } from '@/lib/types'
import AutoScrollCarousel from './AutoScrollCarousel'

interface ProductSectionProps {
  id: string
  title: string
  sectionKey: string
  categorySlug?: string
  products: Product[]
}

export default function ProductSection({
  id,
  title,
  sectionKey,
  categorySlug,
  products,
}: ProductSectionProps) {
  const carouselContainerRef = useRef<HTMLDivElement>(null)

  // If section has 0 products, hide the section entirely
  if (!products || products.length === 0) {
    return null
  }

  const handleScrollPrev = () => {
    const scrollContainer = carouselContainerRef.current?.querySelector('.overflow-x-auto')
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: 240, behavior: 'smooth' })
    }
  }

  const handleScrollNext = () => {
    const scrollContainer = carouselContainerRef.current?.querySelector('.overflow-x-auto')
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: -240, behavior: 'smooth' })
    }
  }

  const viewAllLink = categorySlug
    ? `/category/${categorySlug}`
    : `/laptops?section=${sectionKey}`

  return (
    <section id={id} className="w-full my-6 sm:my-8 scroll-mt-20">
      {/* Refined Dark Navy Banner (#1e293b) */}
      <div className="w-full bg-[#1e293b] text-white shadow-md border-y border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Left Side: "الكل >" link */}
          <Link
            href={viewAllLink}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-sans font-bold text-slate-200 hover:text-white transition-colors bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg border border-white/10"
          >
            <span>الكل</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>

          {/* Centered Section Title */}
          <h2 className="font-sans font-bold text-base sm:text-xl text-white tracking-wide text-center">
            {title}
          </h2>

          {/* Right Side: Manual Left & Right Scroll Arrow Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleScrollPrev}
              aria-label="السابق"
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all border border-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleScrollNext}
              aria-label="التالي"
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all border border-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Row Container */}
      <div
        ref={carouselContainerRef}
        className="w-full bg-slate-50/50 dark:bg-[#111827]/40 border-b border-gray-100 dark:border-gray-800/80 transition-colors"
      >
        <div className="max-w-7xl mx-auto">
          <AutoScrollCarousel
            products={products}
            sectionKey={sectionKey}
            intervalMs={2000}
          />
        </div>
      </div>
    </section>
  )
}
