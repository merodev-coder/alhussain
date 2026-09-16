'use client'

import React from 'react'
import { motion, type Variants } from 'framer-motion'

interface StaggerGroupProps {
  children: React.ReactNode
  className?: string
  amount?: number
  once?: boolean
  staggerDelay?: number
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
}: StaggerGroupProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      exit="hidden"
      viewport={{ once, amount, margin: '0px 0px -60px 0px' }}
      variants={containerVariants}
      custom={staggerDelay}
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
