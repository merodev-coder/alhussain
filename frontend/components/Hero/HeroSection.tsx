'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, ChevronLeft, ArrowLeft, ShieldCheck, Laptop } from 'lucide-react'
import type { HeroSlide } from '@/lib/types'
import HeroSlideText from './HeroSlideText'
import HeroImageCarousel from './HeroImageCarousel'

// Default fallback slides with premium curated laptop assets
const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    headline: 'أقوى أجهزة اللاب توب الاستيراد في مصر',
    subtitle:
      'نخبة من أجهزة اللابتوب للأعمال، الجرافيك والألعاب بضمان حقيقي واختبار شامل لجميع القطع قبل الاستلام.',
    buttonText: 'تصفح أقوى العروض',
    buttonColor: '#2563eb',
    buttonLink: '/laptops',
    badgeImage: null,
    images: [
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1400&q=80',
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
    buttonColor: '#2563eb',
    buttonLink: '/laptops?section=graphics',
    badgeImage: null,
    images: [
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1400&q=80',
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
    buttonColor: '#2563eb',
    buttonLink: '/laptops?section=business',
    badgeImage: null,
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1400&q=80',
    ],
    isActive: true,
    order: 3,
  },
]

interface HeroSectionProps {
  slides?: HeroSlide[]
}

export default function HeroSection({ slides = [] }: HeroSectionProps) {
  // Use passed slides if any are active, otherwise fallback to DEFAULT_SLIDES
  const activeSlides = (slides.length > 0 ? slides : DEFAULT_SLIDES).filter(
    s => s.isActive
  )

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Mobile touch swipe state
  const touchStartXRef = useRef<number | null>(null)
  const touchEndXRef = useRef<number | null>(null)

  const currentSlide = activeSlides[currentSlideIndex] || activeSlides[0]

  // Reset outer and inner timers
  const resetTimers = useCallback(() => {
    // Both timers restart when state updates or triggers
  }, [])

  // Navigation handlers
  const handleNextSlide = useCallback(() => {
    if (activeSlides.length <= 1) return
    setCurrentSlideIndex(prev => (prev + 1) % activeSlides.length)
    setCurrentImageIndex(0) // Reset image index on slide change
  }, [activeSlides.length])

  const handlePrevSlide = useCallback(() => {
    if (activeSlides.length <= 1) return
    setCurrentSlideIndex(prev => (prev - 1 + activeSlides.length) % activeSlides.length)
    setCurrentImageIndex(0) // Reset image index on slide change
  }, [activeSlides.length])

  const handleNextImage = useCallback(() => {
    if (!currentSlide || !currentSlide.images || currentSlide.images.length <= 1) return
    setCurrentImageIndex(prev => (prev + 1) % currentSlide.images.length)
  }, [currentSlide])

  const handlePrevImage = useCallback(() => {
    if (!currentSlide || !currentSlide.images || currentSlide.images.length <= 1) return
    setCurrentImageIndex(prev => (prev - 1 + currentSlide.images.length) % currentSlide.images.length)
  }, [currentSlide])

  const handleSelectImage = useCallback((index: number) => {
    setCurrentImageIndex(index)
  }, [])

  // Timer 1: Outer Hero Slide - Advances every 5 seconds
  useEffect(() => {
    if (isHovered || activeSlides.length <= 1) return
    const outerTimer = setInterval(() => {
      handleNextSlide()
    }, 5000)
    return () => clearInterval(outerTimer)
  }, [isHovered, activeSlides.length, handleNextSlide])

  // Timer 2: Inner Image Carousel - Advances every 2 seconds
  useEffect(() => {
    if (isHovered || !currentSlide || !currentSlide.images || currentSlide.images.length <= 1) return
    const innerTimer = setInterval(() => {
      handleNextImage()
    }, 2000)
    return () => clearInterval(innerTimer)
  }, [isHovered, currentSlide, handleNextImage])

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

  // Fallback when 0 active slides exist
  if (!activeSlides || activeSlides.length === 0) {
    return (
      <section className="relative w-full bg-[#0d0d0d] text-white py-16 sm:py-24 px-6 overflow-hidden min-h-[520px] flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs sm:text-sm font-semibold mb-6">
            <ShieldCheck className="w-4 h-4" />
            <span>متجر الحسين للاب توب — الجودة والضمان أولاً</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-sans font-extrabold mb-4 tracking-tight">
            الحسين للاب توب
          </h1>
          <p className="text-gray-300 text-sm sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed font-body">
            استيراد مباشر لأحدث أجهزة اللابتوب ومحطات العمل بأفضل الأسعار وأطول فترة ضمان في مصر.
          </p>
          <Link
            href="/laptops"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-base shadow-lg transition-all"
          >
            <span>تصفح قائمة الأجهزة المتوفرة</span>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section
      className="relative w-full bg-[#0d0d0d] text-white overflow-hidden select-none min-h-[520px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Responsive Grid: Desktop side-by-side (40% / 60%), Mobile stacked */}
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 items-center gap-8 lg:gap-12 min-h-[460px] lg:min-h-[520px]">
          {/* Left Column (40% on Desktop): Text + CTA */}
          <div className="w-full lg:col-span-5 flex items-center justify-center lg:justify-start">
            <HeroSlideText
              slide={currentSlide}
              slideKey={`${currentSlide.id}-${currentSlideIndex}`}
            />
          </div>

          {/* Right Column (60% on Desktop): Image Carousel */}
          <div className="w-full lg:col-span-7 h-full">
            <HeroImageCarousel
              images={currentSlide.images}
              activeImageIndex={currentImageIndex}
              onSelectImage={handleSelectImage}
              onPrevImage={handlePrevImage}
              onNextImage={handleNextImage}
              isFirstSlide={currentSlideIndex === 0}
            />
          </div>
        </div>
      </div>

      {/* Outer Left & Right Slide Navigation Arrows (Desktop Only) */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={e => {
              e.stopPropagation()
              handlePrevSlide()
            }}
            aria-label="الشريحة السابقة"
            className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/10 hover:bg-white/30 active:scale-95 text-white backdrop-blur-md items-center justify-center transition-all border border-white/10 shadow-xl focus:outline-none"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={e => {
              e.stopPropagation()
              handleNextSlide()
            }}
            aria-label="الشريحة التالية"
            className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/10 hover:bg-white/30 active:scale-95 text-white backdrop-blur-md items-center justify-center transition-all border border-white/10 shadow-xl focus:outline-none"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Outer Slide Indicator Dots for Mobile/Desktop */}
      {activeSlides.length > 1 && (
        <div className="flex justify-center items-center gap-2 pb-4 z-20">
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentSlideIndex(idx)
                setCurrentImageIndex(0)
              }}
              aria-label={`الذهاب للشريحة ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none ${
                idx === currentSlideIndex
                  ? 'w-8 bg-blue-500 opacity-100'
                  : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
