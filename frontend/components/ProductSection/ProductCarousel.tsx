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
const AUTO_ADVANCE_MS = 3200

export default function ProductCarousel({ products, sectionKey }: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isInView, setIsInView] = useState(false)
  // Guards against rapid double-clicks stacking multiple scroll animations,
  // which is what made the arrows feel like they needed several clicks
  // before anything visibly moved.
  const isScrolling = useRef(false)

  // Move by one full "page" of currently-visible cards (not just one card),
  // using a direct pixel scrollBy on the track itself — this is immediate
  // and predictable, unlike scrollIntoView which can silently no-op when
  // the target card is already partially visible in a multi-item viewport.
  const scrollByPage = useCallback((direction: 1 | -1) => {
    const track = trackRef.current
    if (!track || isScrolling.current) return

    const firstCard = track.firstElementChild as HTMLElement | null
    const cardWidth = firstCard?.getBoundingClientRect().width || track.clientWidth
    const gap = 16 // matches the track's gap-4 (16px); sm:gap-6 handled below
    const styles = window.getComputedStyle(track)
    const gapPx = parseFloat(styles.columnGap || styles.gap || String(gap)) || gap

    // RTL: scrolling toward "next" moves left (negative scrollLeft delta in RTL coordinate space).
    const amount = (cardWidth + gapPx) * direction

    isScrolling.current = true
    track.scrollBy({ left: amount, behavior: 'smooth' })
    // Release the guard once the smooth-scroll has had time to finish, so a
    // deliberate next click is never eaten, but a rapid flurry doesn't
    // stack conflicting scrollBy calls that visually cancel out.
    window.setTimeout(() => {
      isScrolling.current = false
    }, 420)
  }, [])

  const goNext = useCallback(() => {
    if (!products.length) return
    setActiveIndex(prev => (prev + 1) % products.length)
    scrollByPage(1)
  }, [products.length, scrollByPage])

  const goPrev = useCallback(() => {
    if (!products.length) return
    setActiveIndex(prev => (prev - 1 + products.length) % products.length)
    scrollByPage(-1)
  }, [products.length, scrollByPage])

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

  // Auto-advance the carousel every few seconds, pausing on hover/touch or when off-screen
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
            className="snap-start shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-16px)] lg:w-[calc(20%-16px)] xl:w-[calc(16.666%-14px)] animate-count"
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
            className="hidden sm:flex absolute -right-3 sm:-right-4 top-[38%] -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-canvas border border-hairline shadow-lg items-center justify-center text-ink hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 focus:outline-none"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={goNext}
            aria-label="المنتج التالي"
            className="hidden sm:flex absolute -left-3 sm:-left-4 top-[38%] -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-canvas border border-hairline shadow-lg items-center justify-center text-ink hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 focus:outline-none"
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
