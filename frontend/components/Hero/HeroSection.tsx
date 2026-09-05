'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, ChevronLeft, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react'
import type { HeroSlide } from '@/lib/types'

// Default fallback slides with premium curated laptop assets
const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    headline: 'أقوى أجهزة اللاب توب الاستيراد في مصر',
    subtitle:
      'نخبة من أجهزة اللابتوب للأعمال، الجرافيك والألعاب بضمان حقيقي واختبار شامل لجميع القطع قبل الاستلام.',
    buttonText: 'تصفح أقوى العروض',
    buttonColor: '',
    buttonLink: '/laptops',
    badgeImage: null,
    images: [
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1920&q=80',
    ],
    isActive: true,
    order: 1,
  },
  {
    id: 'slide-2',
    headline: 'لابتوبات الوركستيشن والجرافيك الاحترافي',
    subtitle:
      'معالجات Core i7/i9 وكروت شاشة RTX مخصصة للمصممين والمهندسين وأعمال الرندر الشاقة بأفضل سعر.',
    buttonText: 'أجهزة الجرافيك والرندر',
    buttonColor: '',
    buttonLink: '/laptops?section=graphics',
    badgeImage: null,
    images: [
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1920&q=80',
    ],
    isActive: true,
    order: 2,
  },
  {
    id: 'slide-3',
    headline: 'سلسلة لابتوبات البيزنس والألترا بوك',
    subtitle:
      'أجهزة ThinkPad وDell Latitude وHP EliteBook بخفة استثنائية، بطاريات تدوم طويلاً، واعتمادية عسكرية.',
    buttonText: 'أجهزة البيزنس والشركات',
    buttonColor: '',
    buttonLink: '/laptops?section=business',
    badgeImage: null,
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1920&q=80',
    ],
    isActive: true,
    order: 3,
  },
]

// The angled corner cut applied to the whole hero card (in px)
const CORNER_CUT = 22
const HERO_CLIP =
  `polygon(${CORNER_CUT}px 0, 100% 0, 100% calc(100% - ${CORNER_CUT}px), calc(100% - ${CORNER_CUT}px) 100%, 0 100%, 0 ${CORNER_CUT}px)`

// Alternate tilt direction per slide so the carousel feels less repetitive
const TILT_ANGLES = ['-6deg', '5deg', '-4deg']

interface HeroSectionProps {
  slides?: HeroSlide[]
}

export default function HeroSection({ slides = [] }: HeroSectionProps) {
  // Use passed slides if any are active, otherwise fallback to DEFAULT_SLIDES
  const activeSlides = (slides.length > 0 ? slides : DEFAULT_SLIDES).filter(
    s => s.isActive
  )

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Mobile touch swipe state
  const touchStartXRef = useRef<number | null>(null)
  const touchEndXRef = useRef<number | null>(null)

  // Navigation handlers
  const handleNextSlide = useCallback(() => {
    if (activeSlides.length <= 1) return
    setCurrentSlideIndex(prev => (prev + 1) % activeSlides.length)
  }, [activeSlides.length])

  const handlePrevSlide = useCallback(() => {
    if (activeSlides.length <= 1) return
    setCurrentSlideIndex(prev => (prev - 1 + activeSlides.length) % activeSlides.length)
  }, [activeSlides.length])

  // Banner auto-advances every 5 seconds
  useEffect(() => {
    if (isHovered || activeSlides.length <= 1) return
    const timer = setInterval(() => {
      handleNextSlide()
    }, 5000)
    return () => clearInterval(timer)
  }, [isHovered, activeSlides.length, handleNextSlide])

  // Mobile touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return
    const diff = touchStartXRef.current - touchEndXRef.current
    const minSwipeDistance = 50

    // In RTL: swiping left (diff > min) moves next, swiping right (diff < -min) moves prev
    if (diff > minSwipeDistance) {
      handleNextSlide()
    } else if (diff < -minSwipeDistance) {
      handlePrevSlide()
    }

    touchStartXRef.current = null
    touchEndXRef.current = null
  }

  const hasSlides = activeSlides && activeSlides.length > 0
  const currentSlide = hasSlides ? activeSlides[currentSlideIndex] : null
  const tilt = TILT_ANGLES[currentSlideIndex % TILT_ANGLES.length]

  return (
    <section
      className="relative w-full overflow-hidden select-none bg-inverse-canvas"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative pt-6 pb-8 sm:pt-14 sm:pb-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-8 lg:px-10">
          {/* Backing panel behind the banner, offset like a shelf, sharing the same angled cut */}
          <div className="relative">
            <div
              className="absolute inset-0 translate-y-3 sm:translate-y-4 bg-brand-primary/15"
              style={{ clipPath: HERO_CLIP }}
            />

            {/* Angled "shaped" banner card */}
            <div
              className="relative overflow-hidden shadow-2xl ring-1 ring-white/10 h-[280px] sm:h-[420px] lg:h-[500px] bg-gradient-to-br from-[#0E1B1B] via-[#0A2E2C] to-[#0E1B1B]"
              style={{ clipPath: HERO_CLIP }}
            >
              {/* Decorative drifting glow blobs for depth & motion */}
              <div className="absolute -top-16 -right-10 w-72 h-72 rounded-full bg-brand-primary/25 blur-3xl animate-blob-drift pointer-events-none" />
              <div className="absolute -bottom-20 left-10 w-80 h-80 rounded-full bg-brand-accent/20 blur-3xl animate-blob-drift-slow pointer-events-none" />

              {/* Faint diagonal speed-line texture for a techy feel */}
              <div
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(115deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 46px)',
                }}
              />

              {/* Brand-colored diagonal accent ribbon reinforcing the angled shape */}
              <div className="absolute -top-6 -left-16 w-56 h-16 bg-gradient-to-r from-brand-primary to-brand-primary/0 rotate-[-14deg] opacity-70 pointer-events-none" />

              {hasSlides && currentSlide ? (
                <React.Fragment key={currentSlide.id}>
                  {/* ===== Mobile layout: full-bleed photo with overlay text ===== */}
                  <div className="sm:hidden relative z-10 h-full">
                    {currentSlide.images?.[0] && (
                      <Image
                        src={currentSlide.images[0]}
                        alt={currentSlide.headline}
                        fill
                        sizes="100vw"
                        priority={currentSlideIndex === 0}
                        className="object-cover object-center animate-hero-image"
                        style={{ ['--hero-tilt' as any]: '0deg' }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-inverse-canvas via-inverse-canvas/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-inverse-canvas/50" />
                    <div className="absolute inset-x-0 bottom-0 p-4 pb-6 text-right animate-hero-text">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-primary/20 text-brand-primary border border-brand-primary/30 text-[10px] font-bold mb-2 animate-hero-badge">
                        <ShieldCheck className="w-3 h-3" />
                        <span>استيراد مباشر — ضمان حقيقي</span>
                      </div>
                      <h1 className="text-lg font-sans font-extrabold text-white leading-snug tracking-tight mb-3 text-balance">
                        {currentSlide.headline}
                      </h1>
                      <Link
                        href={currentSlide.buttonLink || '/laptops'}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-sans font-bold text-white text-xs bg-brand-primary shadow-lg active:scale-95 transition-all duration-200"
                      >
                        <span>{currentSlide.buttonText || 'تصفح الآن'}</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* ===== Desktop / tablet layout: split panel with tilted photo ===== */}
                  <div className="hidden sm:flex relative z-10 h-full items-center">
                    {/* Text panel — reads first in RTL (right side) */}
                    <div className="w-1/2 h-full flex items-center px-8 lg:px-14">
                      <div className="w-full text-right animate-hero-text">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/15 text-brand-primary border border-brand-primary/30 text-xs font-bold mb-4 animate-hero-badge">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>استيراد مباشر — ضمان حقيقي</span>
                        </div>
                        <h1 className="text-3xl lg:text-5xl font-sans font-extrabold text-white leading-tight tracking-tight mb-4 text-balance">
                          {currentSlide.headline}
                        </h1>
                        <p className="text-sm lg:text-base text-white/70 line-clamp-2 leading-relaxed mb-6 font-body">
                          {currentSlide.subtitle}
                        </p>
                        <Link
                          href={currentSlide.buttonLink || '/laptops'}
                          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-sans font-bold text-white text-base bg-brand-primary shadow-lg hover:shadow-xl hover:brightness-110 active:scale-95 transition-all duration-200"
                        >
                          <span>{currentSlide.buttonText || 'تصفح الآن'}</span>
                          <ArrowLeft className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>

                    {/* Angled, floating product photo — anchored to the side like Sigma's hero */}
                    <div className="relative w-1/2 h-full flex items-center justify-center px-4 lg:px-8">
                      <div className="relative w-[82%] lg:w-[85%] aspect-[4/3]">
                        <div
                          aria-hidden="true"
                          className="absolute -inset-3 lg:-inset-4 rounded-[28px] lg:rounded-[32px] bg-inverse-canvas/95 shadow-xl"
                          style={{ transform: 'rotate(5deg)' }}
                        />
                        <div
                          className="relative h-full w-full rounded-[24px] lg:rounded-[28px] overflow-hidden shadow-2xl ring-4 ring-white/10 animate-hero-image animate-float-slow"
                          style={{ ['--hero-tilt' as any]: tilt }}
                        >
                        {currentSlide.images?.[0] && (
                          <Image
                            src={currentSlide.images[0]}
                            alt={currentSlide.headline}
                            fill
                            sizes="(max-width: 1024px) 45vw, 600px"
                            priority={currentSlideIndex === 0}
                            className="object-cover object-center"
                          />
                        )}
                        {/* Glossy animated light sweep across the photo */}
                        <div className="absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shine-sweep pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                      </div>
                    </div>

                      {/* Sticker-style badge overlapping the tilted photo corner */}
                      <div className="flex absolute bottom-6 left-4 lg:left-8 items-center gap-1.5 bg-canvas/95 backdrop-blur-sm text-ink px-3 py-1.5 rounded-full shadow-lg text-[11px] font-bold animate-chip-in">
                        <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                        <span>اختبار شامل قبل الاستلام</span>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ) : (
                <div className="relative z-10 h-full flex items-center justify-center">
                  <div className="max-w-xl mx-auto text-center px-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs sm:text-sm font-semibold mb-4">
                      <ShieldCheck className="w-4 h-4" />
                      <span>متجر الحسين للاب توب — الجودة والضمان أولاً</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-sans font-extrabold text-white mb-3 tracking-tight">
                      الحسين للاب توب
                    </h1>
                    <Link
                      href="/laptops"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-primary hover:brightness-110 text-white font-bold text-sm shadow-lg transition-all"
                    >
                      <span>تصفح قائمة الأجهزة المتوفرة</span>
                      <ArrowLeft className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Left & Right Navigation Arrows (Desktop Only) */}
              {activeSlides.length > 1 && (
                <>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handlePrevSlide()
                    }}
                    aria-label="الشريحة السابقة"
                    className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white backdrop-blur-md items-center justify-center transition-all border border-white/15 shadow-xl focus:outline-none"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleNextSlide()
                    }}
                    aria-label="الشريحة التالية"
                    className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white backdrop-blur-md items-center justify-center transition-all border border-white/15 shadow-xl focus:outline-none"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Slide Indicator Dots */}
              {activeSlides.length > 1 && (
                <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                  {activeSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      aria-label={`الذهاب للشريحة ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none ${
                        idx === currentSlideIndex
                          ? 'w-8 bg-brand-primary opacity-100'
                          : 'w-2 bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
