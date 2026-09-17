'use client'

import React from 'react'
import { motion, type Variants } from 'framer-motion'

interface RevealProps {
  children: React.ReactNode
  className?: string
  /** 'up' (default) | 'left' | 'right' | 'scale' */
  direction?: 'up' | 'left' | 'right' | 'scale'
  delay?: number
  /** Fraction of the element that must be visible to trigger. */
  amount?: number
  /** If true, plays once and stays; otherwise replays every time it re-enters the viewport. */
  once?: boolean
  as?: 'div' | 'section' | 'span' | 'ul' | 'li' | 'article'
}

const OFFSETS: Record<NonNullable<RevealProps['direction']>, { x?: number; y?: number; scale?: number }> = {
  up: { y: 32 },
  left: { x: -36 },
  right: { x: 36 },
  scale: { y: 20, scale: 0.94 },
}

/**
 * Animates its children in once as they first scroll into view, then leaves
 * them alone — it does not fade them back out if the user scrolls past.
 */
export default function Reveal({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  amount = 0.2,
  once = true,
  as = 'div',
}: RevealProps) {
  const offset = OFFSETS[direction]

  const variants: Variants = {
    hidden: { opacity: 0, x: offset.x ?? 0, y: offset.y ?? 0, scale: offset.scale ?? 1 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration: 0.65, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] },
    },
  }

  const MotionTag = motion[as as 'div']

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount, margin: '0px 0px -80px 0px' }}
      variants={variants}
    >
      {children}
    </MotionTag>
  )
}
