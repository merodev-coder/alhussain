'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { Product } from '@/lib/types'
import ProductCard from './ProductCard'

interface AutoScrollCarouselProps {
  products: Product[]
  sectionKey: string
  intervalMs?: number
}

export default function AutoScrollCarousel({
  products,
  sectionKey,
  intervalMs = 2000,
}: AutoScrollCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  // Duplicate products array for seamless looping if enough items
  const shouldLoop = products.length >= 3
  const displayProducts = shouldLoop ? [...products, ...products] : products

  // Determine card step based on screen width
  const getStepSize = () => {
    if (typeof window === 'undefined') return 236
    return window.innerWidth < 640 ? 172 : 236
  }

  // Scroll forward (RTL aware)
  const scrollForward = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const step = getStepSize()

    const halfWidth = el.scrollWidth / 2
    const currentScroll = Math.abs(el.scrollLeft)

    // If we've reached or passed the cloned midpoint, instant-shift back by halfWidth
    if (shouldLoop && currentScroll >= halfWidth - step) {
      if (el.scrollLeft < 0) {
        el.scrollLeft = el.scrollLeft + halfWidth
      } else {
        el.scrollLeft = el.scrollLeft - halfWidth
      }
    }

    el.scrollBy({ left: -step, behavior: 'smooth' })
  }, [shouldLoop])

  // Scroll backward (RTL aware)
  const scrollBackward = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const step = getStepSize()
    const halfWidth = el.scrollWidth / 2
    const currentScroll = Math.abs(el.scrollLeft)

    if (shouldLoop && currentScroll <= step) {
      if (el.scrollLeft < 0) {
        el.scrollLeft = el.scrollLeft - halfWidth
      } else {
        el.scrollLeft = el.scrollLeft + halfWidth
      }
    }

    el.scrollBy({ left: step, behavior: 'smooth' })
  }, [shouldLoop])

  // Auto-scroll effect
  useEffect(() => {
    if (!shouldLoop || isHovered) return

    const timer = setInterval(() => {
      scrollForward()
    }, intervalMs)

    return () => clearInterval(timer)
  }, [shouldLoop, isHovered, intervalMs, scrollForward])

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={containerRef}
        className="flex items-center gap-3 sm:gap-4 overflow-x-auto py-4 px-4 sm:px-6 lg:px-8 no-scrollbar select-none"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {displayProducts.map((product, idx) => (
          <ProductCard
            key={`${sectionKey}-${product.id}-${idx}`}
            product={product}
          />
        ))}
      </div>
    </div>
  )
}
