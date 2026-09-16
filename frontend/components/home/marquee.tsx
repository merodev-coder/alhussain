'use client'

import React, { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface MarqueeProps {
  children: React.ReactNode
  /** Seconds for one full loop of the content. */
  durationSec?: number
  className?: string
  pauseOnHover?: boolean
  /** RTL sites read right-to-left, but a marquee still just needs a consistent direction of travel. 'start' scrolls toward the reading start (right in RTL), 'end' the opposite. */
  reverse?: boolean
}

/**
 * Infinite horizontal marquee built on framer-motion. Renders the children
 * twice back-to-back and animates a translateX loop from 0 to -50% (or the
 * mirrored direction), so the strip appears to scroll forever with no seam.
 */
export default function Marquee({
  children,
  durationSec = 24,
  className = '',
  pauseOnHover = false,
  reverse = false,
}: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [halfWidth, setHalfWidth] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const node = trackRef.current
    if (!node) return
    // Width of one copy of the content (the track holds two copies).
    setHalfWidth(node.scrollWidth / 2)
  }, [children])

  const distance = halfWidth || 1000
  const from = reverse ? -distance : 0
  const to = reverse ? 0 : -distance

  return (
    <div
      className={`w-full overflow-hidden ${className}`}
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
    >
      <motion.div
        ref={trackRef}
        className="flex w-max"
        animate={paused ? undefined : { x: [from, to] }}
        transition={{ duration: durationSec, ease: 'linear', repeat: Infinity }}
      >
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden="true">
          {children}
        </div>
      </motion.div>
    </div>
  )
}
