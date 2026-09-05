'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Product } from '@/lib/types'
import { getCategoryHref } from '@/lib/category-routes'
import ProductCarousel from './ProductCarousel'

interface ProductSectionProps {
  id: string
  title: string
  sectionKey: string
  categorySlug?: string
  products: Product[]
}

// Show at most this many products in the home page carousel; the rest are reachable via "View All"
const MAX_VISIBLE = 12

export default function ProductSection({
  id,
  title,
  sectionKey,
  categorySlug,
  products,
}: ProductSectionProps) {
  // If section has 0 products, hide the section entirely
  if (!products || products.length === 0) {
    return null
  }

  const viewAllLink = getCategoryHref(categorySlug || sectionKey)

  const visibleProducts = products.slice(0, MAX_VISIBLE)

  return (
    <section id={id} className="w-full py-10 sm:py-14 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="font-sans font-extrabold text-xl sm:text-2xl lg:text-3xl text-ink tracking-tight">
              {title}
            </h2>
            <div className="h-1 w-14 rounded-full bg-brand-primary mt-2" />
          </div>

          <Link
            href={viewAllLink}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs sm:text-sm font-sans font-bold text-brand-primary hover:text-brand-primary/80 transition-colors border border-brand-primary/30 hover:border-brand-primary/60 px-3 sm:px-4 py-2 rounded-xl"
          >
            <span>عرض الكل</span>
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>

        {/* Auto-advancing product carousel */}
        <ProductCarousel products={visibleProducts} sectionKey={sectionKey} />
      </div>
    </section>
  )
}
