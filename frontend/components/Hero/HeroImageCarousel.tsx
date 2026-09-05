'use client'

import React from 'react'
import Image from 'next/image'
import { ChevronRight, ChevronLeft } from 'lucide-react'

interface HeroImageCarouselProps {
  images: string[]
  activeImageIndex: number
  onSelectImage: (index: number) => void
  onPrevImage: () => void
  onNextImage: () => void
  isFirstSlide?: boolean
}

export default function HeroImageCarousel({
  images,
  activeImageIndex,
  onSelectImage,
  onPrevImage,
  onNextImage,
  isFirstSlide = false,
}: HeroImageCarouselProps) {
  const safeImages = images && images.length > 0 ? images : ['/logo.jpeg']
  const currentIndex = activeImageIndex % safeImages.length

  return (
    <div className="relative w-full h-full min-h-[260px] sm:min-h-[380px] lg:min-h-[520px] overflow-hidden rounded-2xl sm:rounded-3xl bg-neutral-900 select-none">
      {/* Images with 400ms Crossfade */}
      {safeImages.map((src, idx) => {
        const isActive = idx === currentIndex
        return (
          <div
            key={`${src}-${idx}`}
            className={`absolute inset-0 transition-opacity duration-400 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <Image
              src={src}
              alt={`صورة العرض ${idx + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 60vw"
              priority={isFirstSlide && idx === 0}
              loading={isFirstSlide && idx === 0 ? 'eager' : 'lazy'}
              className="object-cover object-center w-full h-full"
            />
            {/* Subtle dark gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
          </div>
        )
      })}

      {/* Inner Left and Right Overlaid Arrow Buttons */}
      {safeImages.length > 1 && (
        <>
          <button
            onClick={e => {
              e.stopPropagation()
              onPrevImage()
            }}
            aria-label="الصورة السابقة"
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 min-w-[48px] min-h-[48px] rounded-full bg-white/40 hover:bg-white/70 active:scale-95 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-md focus:outline-none"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={e => {
              e.stopPropagation()
              onNextImage()
            }}
            aria-label="الصورة التالية"
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 min-w-[48px] min-h-[48px] rounded-full bg-white/40 hover:bg-white/70 active:scale-95 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-md focus:outline-none"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {safeImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1.5 rounded-full bg-black/30 backdrop-blur-sm">
          {safeImages.map((_, idx) => {
            const isActive = idx === currentIndex
            return (
              <button
                key={idx}
                onClick={e => {
                  e.stopPropagation()
                  onSelectImage(idx)
                }}
                aria-label={`الذهاب للصورة ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none ${
                  isActive
                    ? 'w-7 bg-white opacity-100 shadow'
                    : 'w-2.5 bg-white opacity-40 hover:opacity-70'
                }`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
