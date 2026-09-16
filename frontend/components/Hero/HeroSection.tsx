'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, ChevronLeft, ShieldCheck, ArrowLeft } from 'lucide-react'
import type { HeroSlide } from '@/lib/types'

// Fallback content shown until the dashboard has real slides configured.
const DEFAULT_MAIN_SLIDE: HeroSlide = {
  id: 'default-main',
  headline: '',
  subtitle: '',
  buttonText: '',
  buttonColor: '',
  buttonLink: '/laptops',
  badgeImage: null,
  images: [
    'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1600&q=80',
  ],
  isActive: true,
  order: 1,
}

const DEFAULT_SIDE_SLIDES: HeroSlide[] = [
  {
    id: 'default-side-1',
    headline: 'لابتوبات الجرافيك والرندر',
    subtitle: '',
    buttonText: '',
    buttonColor: '',
    buttonLink: '/laptops',
    badgeImage: null,
    images: [
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=900&q=80',
    ],
    isActive: true,
    order: 2,
  },
  {
    id: 'default-side-2',
    headline: 'لابتوبات البيزنس',
    subtitle: '',
    buttonText: '',
    buttonColor: '',
    buttonLink: '/laptops',
    badgeImage: null,
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
    ],
    isActive: true,
    order: 3,
  },
]

const CORNER_CUT = 20
const clipFor = (cut: number) =>
  `polygon(${cut}px 0, 100% 0, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, 0 100%, 0 ${cut}px)`

interface HeroSectionProps {
  slides?: HeroSlide[]
}

/**
 * Big slideshow card. Cycles through `slide.images` automatically. If the
 * slide carries a headline, it's overlaid at the bottom; when the admin adds
 * an image-only slide (no headline), the card is purely visual.
 */
function MainSlideshow({ slide }: { slide: HeroSlide }) {
  const images = slide.images?.length ? slide.images : ['/logo.jpeg']
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

  return (
    <div
      className="relative h-full w-full overflow-hidden shadow-2xl ring-1 ring-white/10 bg-gradient-to-br from-[#0E1B1B] via-[#0A2E2C] to-[#0E1B1B]"
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
            alt={slide.headline || 'الحسين للاب توب'}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority={i === 0}
            className="object-cover object-center"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent sm:from-black/55 sm:via-black/5 z-20 pointer-events-none" />

      {/* Glossy sweep for a lively feel */}
      <div className="absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shine-sweep pointer-events-none z-20" />

      {slide.headline && (
        <div className="absolute inset-x-0 bottom-0 z-30 p-4 sm:p-8 text-right animate-hero-text">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-primary/20 text-white border border-white/20 text-[10px] sm:text-xs font-bold mb-2 sm:mb-3 backdrop-blur-sm">
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>استيراد مباشر — ضمان حقيقي</span>
          </div>
          <h1 className="text-lg sm:text-3xl lg:text-4xl font-sans font-extrabold text-white leading-snug sm:leading-tight tracking-tight mb-2 sm:mb-3 text-balance max-w-xl">
            {slide.headline}
          </h1>
          {slide.subtitle && (
            <p className="hidden sm:block text-sm text-white/75 leading-relaxed mb-4 max-w-lg font-body line-clamp-2">
              {slide.subtitle}
            </p>
          )}
          {slide.buttonText && (
            <Link
              href={slide.buttonLink || '/laptops'}
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-7 py-2 sm:py-3 rounded-xl font-sans font-bold text-white text-xs sm:text-sm bg-brand-primary shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200"
            >
              <span>{slide.buttonText}</span>
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          )}
        </div>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
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
            onClick={goPrev}
            aria-label="السابق"
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md items-center justify-center text-white transition-all border border-white/15"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            aria-label="التالي"
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md items-center justify-center text-white transition-all border border-white/15"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  )
}

/** Smaller side card: a single (possibly clickable) image with an optional caption. */
function SideCard({ slide, delay }: { slide: HeroSlide; delay: number }) {
  const image = slide.images?.[0]
  const content = (
    <div
      className="group relative h-full w-full overflow-hidden shadow-xl ring-1 ring-white/10 bg-surface-2 lg:animate-float-slow"
      style={{ clipPath: clipFor(14), animationDelay: `${delay}ms` }}
    >
      {image && (
        <Image
          src={image}
          alt={slide.headline || 'الحسين للاب توب'}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 22vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      {slide.headline && (
        <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 lg:p-4 text-right">
          <p className="text-white font-sans font-bold text-[11px] sm:text-xs lg:text-sm leading-snug text-balance line-clamp-2">
            {slide.headline}
          </p>
        </div>
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

  const mainSlide = activeSlides[0] || DEFAULT_MAIN_SLIDE
  const sideSlides = activeSlides.length > 1 ? activeSlides.slice(1, 3) : DEFAULT_SIDE_SLIDES

  return (
    <section className="relative w-full overflow-hidden select-none bg-transparent">
      <div className="relative pt-4 pb-6 sm:pt-10 sm:pb-12">
        <div className="mx-auto w-[94%] sm:w-[92%] max-w-[1500px]">
          <div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-3 sm:gap-5 h-auto lg:h-[440px]">
            {/* Big slideshow — right side in RTL, first in DOM so it reads first */}
            <div className="order-1 lg:order-2 h-[220px] sm:h-[360px] lg:h-full animate-hero-image" style={{ ['--hero-tilt' as any]: '0deg' }}>
              <MainSlideshow slide={mainSlide} />
            </div>

            {/* Two smaller cards — side-by-side under the main image on mobile, stacked on the left on desktop */}
            <div className="order-2 lg:order-1 grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-5 h-[130px] sm:h-[170px] lg:h-full">
              {sideSlides.map((s, i) => (
                <div key={s.id} className="h-full">
                  <SideCard slide={s} delay={i * 200} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
