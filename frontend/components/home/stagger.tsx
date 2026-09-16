'use client'

import React from 'react'
import { motion, type Variants } from 'framer-motion'

interface StaggerGroupProps {
  children: React.ReactNode
  className?: string
  amount?: number
  once?: boolean
  staggerDelay?: number
  /**
   * Animate in as soon as the group mounts instead of waiting for
   * `whileInView`'s IntersectionObserver. Use this for rows that sit in (or
   * very near) the initial viewport — e.g. the category icons right under
   * the hero. `whileInView` can miss content that's technically visible on
   * first paint but whose layout is still settling (images/fonts loading
   * in above it shift things around), which made those rows stay stuck at
   * opacity 0 until the user scrolled down and back up to re-trigger the
   * observer. Content further down the page should keep the default
   * scroll-triggered behavior.
   */
  animateOnMount?: boolean
}

const containerVariants: Variants = {
  hidden: {},
  visible: (staggerDelay: number) => ({
    transition: { staggerChildren: staggerDelay, delayChildren: 0.05 },
  }),
}

/** Wrap a grid/row of children in this, then wrap each child in <StaggerItem>. */
export function StaggerGroup({
  children,
  className = '',
  amount = 0.15,
  once = false,
  staggerDelay = 0.08,
  animateOnMount = false,
}: StaggerGroupProps) {
  const triggerProps = animateOnMount
    ? { animate: 'visible' as const }
    : { whileInView: 'visible' as const, viewport: { once, amount, margin: '0px 0px -60px 0px' } }

  return (
    <motion.div
      className={className}
      initial="hidden"
      exit="hidden"
      variants={containerVariants}
      custom={staggerDelay}
      {...triggerProps}
    >
      {children}
    </motion.div>
  )
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export function StaggerItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  )
}
