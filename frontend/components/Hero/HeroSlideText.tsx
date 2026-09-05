'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { HeroSlide } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'

interface HeroSlideTextProps {
  slide: HeroSlide
  slideKey: string | number
}

export default function HeroSlideText({ slide, slideKey }: HeroSlideTextProps) {
  // Brand blue is default; disciplined styling
  const buttonBg = slide.buttonColor && /^#([0-9A-F]{3}){1,2}$/i.test(slide.buttonColor)
    ? slide.buttonColor
    : '#2563eb'

  return (
    <div
      key={slideKey}
      className="flex flex-col justify-center h-full max-w-xl text-right z-10 animate-hero-fade-in"
      style={{
        animation: 'heroTextEnter 0.5s ease-in-out forwards',
      }}
    >
      <style jsx>{`
        @keyframes heroTextEnter {
          0% {
            opacity: 0;
            transform: translateX(-30px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      {/* Headline */}
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold text-white leading-tight tracking-tight mb-4">
        {slide.headline}
      </h1>

      {/* Subtitle */}
      <p className="text-sm sm:text-base text-gray-300 line-clamp-3 leading-relaxed mb-6 font-body">
        {slide.subtitle}
      </p>

      {/* CTA Button */}
      <div className="flex items-center gap-4">
        <Link
          href={slide.buttonLink || '/laptops'}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl font-sans font-bold text-white text-sm sm:text-base shadow-lg hover:shadow-xl hover:brightness-110 active:scale-95 transition-all duration-200"
          style={{ backgroundColor: buttonBg }}
        >
          <span>{slide.buttonText || 'تصفح الآن'}</span>
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Link>
      </div>

      {/* Optional Badge / Brand Logo */}
      {slide.badgeImage && (
        <div className="mt-6 flex items-center gap-2">
          <div className="relative h-10 w-24 sm:h-12 sm:w-32 opacity-90 hover:opacity-100 transition-opacity">
            <Image
              src={slide.badgeImage}
              alt="شعار"
              fill
              sizes="128px"
              className="object-contain object-right"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  )
}
