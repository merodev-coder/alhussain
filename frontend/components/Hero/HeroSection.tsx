'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { HeroSlide } from '@/lib/types'

const CORNER_CUT = 20
const clipFor = (cut: number) =>
  `polygon(${cut}px 0, 100% 0, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, 0 100%, 0 ${cut}px)`

interface HeroSectionProps {
  slides?: HeroSlide[]
}

/**
 * Big image-only slideshow. Cycles through `slide.images` automatically.
 * Purely visual — no headline, badge, subtitle, or button overlay. If the
 * slide has a link, the whole card is clickable.
 */
function MainSlideshow({ slide }: { slide: HeroSlide }) {
  const images = slide.images || []
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  useEffect(() => {
    if (hovered || images.length <= 1) return
    const timer = setInterval(() => setIndex(i => (i + 1) % images.length), 4500)
    return () => clearInterval(timer)
  }, [hovered, images.length])

  const goNext = useCallback(() => setIndex(i => (i + 1) % images.length), [images.length])
  const goPrev = useCallback(() => setIndex(i => (i - 1 + images.length) % images.length), [images.length])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }
  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return
    const diff = touchStartX.current - touchEndX.current
    const minSwipe = 40
    // RTL: swiping left moves to next, swiping right moves to previous.
    if (diff > minSwipe) goNext()
    else if (diff < -minSwipe) goPrev()
    touchStartX.current = null
    touchEndX.current = null
  }

  if (images.length === 0) {
    return (
      <div
        className="h-full w-full bg-surface-2 ring-1 ring-hairline"
        style={{ clipPath: clipFor(CORNER_CUT) }}
      />
    )
  }

  const body = (
    <div
      className="relative h-full w-full overflow-hidden shadow-2xl ring-1 ring-white/10 bg-surface-2"
      style={{ clipPath: clipFor(CORNER_CUT) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {images.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <Image
            src={src}
            alt="الحسين للاب توب"
            fill
            sizes="(max-width: 1024px) 100vw, 65vw"
            priority={i === 0}
            className="object-cover object-center"
          />
        </div>
      ))}

      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => {
                e.preventDefault()
                setIndex(i)
              }}
              aria-label={`صورة ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}

      {images.length > 1 && (
        <>
          <button
            onClick={e => {
              e.preventDefault()
              goPrev()
            }}
            aria-label="السابق"
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md items-center justify-center text-white transition-all border border-white/15"
          >
            ‹
          </button>
          <button
            onClick={e => {
              e.preventDefault()
              goNext()
            }}
            aria-label="التالي"
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md items-center justify-center text-white transition-all border border-white/15"
          >
            ›
          </button>
        </>
      )}
    </div>
  )

  if (slide.buttonLink) {
    return (
      <Link href={slide.buttonLink} className="block h-full w-full">
        {body}
      </Link>
    )
  }
  return body
}

/** Smaller side card: a single image only, no caption. */
function SideCard({ slide }: { slide: HeroSlide }) {
  const image = slide.images?.[0]
  const content = (
    <div
      className="group relative h-full w-full overflow-hidden shadow-xl ring-1 ring-white/10 bg-surface-2"
      style={{ clipPath: clipFor(14) }}
    >
      {image && (
        <Image
          src={image}
          alt="الحسين للاب توب"
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 30vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
      )}
    </div>
  )

  if (slide.buttonLink) {
    return (
      <Link href={slide.buttonLink} className="block h-full w-full">
        {content}
      </Link>
    )
  }
  return content
}

export default function HeroSection({ slides = [] }: HeroSectionProps) {
  const activeSlides = slides.filter(s => s.isActive).sort((a, b) => a.order - b.order)

  const mainSlide = activeSlides[0]
  const sideSlides = activeSlides.slice(1, 3)

  // Nothing configured in the dashboard yet — don't render an empty hero block.
  if (!mainSlide) return null

  return (
    <section className="relative w-full overflow-hidden select-none bg-transparent">
      <div className="relative pt-4 pb-6 sm:pt-10 sm:pb-12">
        <div className="mx-auto w-[90%] max-w-[1600px]">
          <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-3 sm:gap-5 h-auto lg:h-[520px]">
            {/* Big slideshow card */}
            <div className="h-[280px] sm:h-[420px] lg:h-full">
              <MainSlideshow slide={mainSlide} />
            </div>

            {/* Two smaller cards — side-by-side under the main image on mobile, stacked next to it on desktop */}
            {sideSlides.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-5 h-[160px] sm:h-[200px] lg:h-full">
                {sideSlides.map(s => (
                  <div key={s.id} className="h-full">
                    <SideCard slide={s} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
