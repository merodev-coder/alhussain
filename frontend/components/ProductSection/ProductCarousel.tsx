'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import type { Product } from '@/lib/types'
import ProductCard from './ProductCard'

interface ProductCarouselProps {
  products: Product[]
  sectionKey: string
}

// Auto-advance interval for the carousel
const AUTO_ADVANCE_MS = 2500

export default function ProductCarousel({ products, sectionKey }: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Array<HTMLDivElement | null>>([])
  const sectionRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isInView, setIsInView] = useState(false)

  // Scroll only the carousel's own track — never the page. We compute the
  // pixel delta between the target item and the track using bounding boxes
  // (which are direction-agnostic) and move the track with scrollBy, which
  // never bubbles up to scroll any ancestor or the document.
  const scrollToIndex = useCallback((idx: number) => {
    const track = trackRef.current
    const item = itemRefs.current[idx]
    if (!track || !item) return
    const trackRect = track.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()
    const delta = itemRect.left - trackRect.left
    track.scrollBy({ left: delta, behavior: 'smooth' })
  }, [])

  const goNext = useCallback(() => {
    if (!products.length) return
    setActiveIndex(prev => {
      const next = (prev + 1) % products.length
      scrollToIndex(next)
      return next
    })
  }, [products.length, scrollToIndex])

  const goPrev = useCallback(() => {
    if (!products.length) return
    setActiveIndex(prev => {
      const next = (prev - 1 + products.length) % products.length
      scrollToIndex(next)
      return next
    })
  }, [products.length, scrollToIndex])

  // Only run the autoplay timer while this carousel is actually visible on
  // screen, so off-screen sections never trigger any scrolling at all.
  useEffect(() => {
    const node = sectionRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsInView(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.35 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // Auto-advance the carousel every 2.5 seconds, pausing on hover/touch or when off-screen
  useEffect(() => {
    if (isPaused || !isInView || products.length <= 1) return
    const timer = setInterval(goNext, AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [isPaused, isInView, products.length, goNext])

  if (!products || products.length === 0) return null

  return (
    <div
      ref={sectionRef}
      className="relative group/carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Scrollable track */}
      <div
        ref={trackRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory no-scrollbar pb-1"
        role="region"
        aria-label="عرض المنتجات"
      >
        {products.map((product, idx) => (
          <div
            key={`${sectionKey}-${product.id}`}
            ref={el => {
              itemRefs.current[idx] = el
            }}
            className="snap-start shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] animate-count"
            style={{ animationDelay: `${idx * 70}ms` }}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Manual navigation arrows, revealed on hover (desktop) */}
      {products.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="المنتج السابق"
            className="hidden sm:flex absolute -left-3 sm:-left-4 top-[38%] -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-canvas border border-hairline shadow-lg items-center justify-center text-ink hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 focus:outline-none"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={goNext}
            aria-label="المنتج التالي"
            className="hidden sm:flex absolute -right-3 sm:-right-4 top-[38%] -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-canvas border border-hairline shadow-lg items-center justify-center text-ink hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 focus:outline-none"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mt-5">
            {products.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeIndex ? 'w-6 bg-brand-primary' : 'w-1.5 bg-hairline'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
