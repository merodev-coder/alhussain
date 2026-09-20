'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import type { Accessory, Product } from '@/lib/types'
import ProductCard from './ProductCard'

interface ProductCarouselProps {
  products: (Product | Accessory)[]
  sectionKey: string
}

// Auto-advance interval for the carousel
const AUTO_ADVANCE_MS = 3200

export default function ProductCarousel({ products, sectionKey }: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [progress, setProgress] = useState(0)
  // Guards against rapid double-clicks stacking multiple scroll animations.
  const isScrolling = useRef(false)
  const releaseGuardTimer = useRef<number | null>(null)

  // Step one card at a time, always measured from wherever the track
  // actually is right now — never from a separately tracked "active index".
  //
  // The old version kept its own activeIndexRef and scrolled to
  // `track.children[index]`. That index only matched reality as long as
  // nothing else ever moved the track. The moment a user dragged/swiped the
  // row by hand, or autoplay and a click landed back to back, the tracked
  // index silently drifted out of sync with the real scroll offset — so the
  // arrow would scroll to a card that was already on screen (or skip past
  // the next one), which is exactly what "the arrows don't work" looks like.
  // Reading scrollLeft fresh on every click removes that whole class of bug.
  const step = useCallback(
    (direction: 1 | -1) => {
      const track = trackRef.current
      if (!track || isScrolling.current || products.length <= 1) return

      const firstCard = track.children[0] as HTMLElement | undefined
      if (!firstCard) return
      const cardWidth = firstCard.getBoundingClientRect().width
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0')
      const stepSize = cardWidth + gap

      const maxScroll = track.scrollWidth - track.clientWidth
      // RTL browsers report scrollLeft as 0..-maxScroll; normalize to a
      // plain positive 0..maxScroll "distance scrolled" value so the same
      // math works regardless of scroll-direction quirks.
      const current = Math.abs(track.scrollLeft)
      // "Next" in this RTL row moves further into negative scrollLeft
      // (visually leftward), so direction is inverted relative to a normal
      // LTR carousel.
      let target = current + direction * stepSize
      if (target > maxScroll) target = 0 // wrap to the start
      if (target < 0) target = maxScroll // wrap to the end

      const sign = track.scrollLeft < 0 || getComputedStyle(track).direction === 'rtl' ? -1 : 1

      isScrolling.current = true
      track.scrollTo({ left: sign * target, behavior: 'smooth' })

      if (releaseGuardTimer.current) window.clearTimeout(releaseGuardTimer.current)
      releaseGuardTimer.current = window.setTimeout(() => {
        isScrolling.current = false
      }, 500)
    },
    [products.length]
  )

  const goNext = useCallback(() => step(1), [step])
  const goPrev = useCallback(() => step(-1), [step])

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

  // The scroll snap + progress bar wiring is done, but on desktop the
  // browser has its own default here that fights the user: an element that
  // can only scroll horizontally (like this row) silently redirects a
  // vertical mouse-wheel gesture into horizontal scrolling instead of
  // letting it bubble up to scroll the page. That's why rolling the wheel
  // over the middle of a product row scrolled the row sideways instead of
  // scrolling the page down. A real horizontal gesture (trackpad swipe,
  // shift+wheel) still has a meaningful deltaX and is left alone; only a
  // vertical-dominant wheel tick is redirected back to the page.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      e.preventDefault()
      window.scrollBy({ top: e.deltaY, left: 0 })
    }
    track.addEventListener('wheel', handleWheel, { passive: false })
    return () => track.removeEventListener('wheel', handleWheel)
  }, [])

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
        {products.map(product => (
          <div
            key={`${sectionKey}-${product.id}`}
            className="snap-start shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-16px)] lg:w-[calc(20%-16px)] xl:w-[calc(16.666%-14px)]"
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
