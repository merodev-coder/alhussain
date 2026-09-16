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
  const activeIndexRef = useRef(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [progress, setProgress] = useState(0)
  // Guards against rapid double-clicks stacking multiple scroll animations.
  const isScrolling = useRef(false)
  const releaseGuardTimer = useRef<number | null>(null)

  // Move to a specific card by index using scrollIntoView on the card itself
  // rather than a hand-computed pixel offset. Computing "cardWidth + gap"
  // and calling scrollBy() used to fight the track's CSS scroll-snap: the
  // pixel amount often didn't land exactly on the next snap point, so the
  // browser would snap back to where it started and the click appeared to
  // do nothing — the site felt like it needed two clicks per move.
  // scrollIntoView lets the browser calculate the exact snap-aligned
  // position itself, so a single click always visibly moves the row.
  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return
    const card = track.children[index] as HTMLElement | undefined
    if (!card) return

    isScrolling.current = true
    card.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })

    if (releaseGuardTimer.current) window.clearTimeout(releaseGuardTimer.current)
    releaseGuardTimer.current = window.setTimeout(() => {
      isScrolling.current = false
    }, 500)
  }, [])

  const goNext = useCallback(() => {
    if (!products.length || isScrolling.current) return
    const next = (activeIndexRef.current + 1) % products.length
    activeIndexRef.current = next
    scrollToIndex(next)
  }, [products.length, scrollToIndex])

  const goPrev = useCallback(() => {
    if (!products.length || isScrolling.current) return
    const prev = (activeIndexRef.current - 1 + products.length) % products.length
    activeIndexRef.current = prev
    scrollToIndex(prev)
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

  // Auto-advance the carousel every few seconds, pausing on hover/touch or when off-screen
  useEffect(() => {
    if (isPaused || !isInView || products.length <= 1) return
    const timer = setInterval(goNext, AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [isPaused, isInView, products.length, goNext])

  // Track real scroll position (from arrow clicks, autoplay, or the user
  // dragging/swiping the row by hand) and turn it into a single progress
  // percentage — replacing the old one-dot-per-product indicator, which
  // became an unusable wall of dots once a section had dozens of products.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let rafId: number | null = null
    const updateProgress = () => {
      rafId = null
      const { scrollLeft, scrollWidth, clientWidth } = track
      const maxScroll = scrollWidth - clientWidth
      if (maxScroll <= 1) {
        setProgress(0)
        return
      }
      // Modern browsers report RTL scrollLeft as 0..-maxScroll, so
      // Math.abs() normalizes it into a plain 0..1 progress fraction.
      const pct = Math.min(1, Math.max(0, Math.abs(scrollLeft) / maxScroll)) * 100
      setProgress(pct)
    }
    const onScroll = () => {
      if (rafId != null) return
      rafId = window.requestAnimationFrame(updateProgress)
    }

    updateProgress()
    track.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      track.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafId != null) window.cancelAnimationFrame(rafId)
    }
  }, [products.length])

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
            className="hidden sm:flex absolute -right-3 sm:-right-4 top-[38%] -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-canvas border border-hairline shadow-lg items-center justify-center text-ink hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 focus:outline-none active:scale-90"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={goNext}
            aria-label="المنتج التالي"
            className="hidden sm:flex absolute -left-3 sm:-left-4 top-[38%] -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-canvas border border-hairline shadow-lg items-center justify-center text-ink hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 focus:outline-none active:scale-90"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Progress bar — fills from the right toward the left as the row scrolls */}
          <div
            className="mt-5 h-1.5 w-full max-w-[220px] mx-auto rounded-full bg-hairline overflow-hidden"
            dir="rtl"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-brand-primary transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}
    </div>
  )
}
