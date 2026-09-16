'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Split into individual words so each one can fade in on its own, in
// sequence, rather than the whole sentence appearing at once.
const WELCOME_WORDS = [
  'مرحباً',
  'بيك',
  'في',
  'متجر',
  'الحسين',
  'هتلاقي',
  'هنا',
  'اللاب',
  'توب',
  'اللي',
  'بتدوّر',
  'عليه',
  'بأحسن',
  'سعر',
]

// Only show the intro once per browser session (first visit), not on
// every internal navigation, so it doesn't get in the way on repeat views.
const SESSION_KEY = 'alhussain_splash_seen'

const WORD_STAGGER_S = 0.09
const HOLD_AFTER_TEXT_MS = 650
const EXIT_DURATION_S = 0.9

export default function SplashScreen() {
  const [phase, setPhase] = useState<'idle' | 'visible' | 'exiting'>('idle')

  useEffect(() => {
    let alreadySeen = false
    try {
      alreadySeen = sessionStorage.getItem(SESSION_KEY) === '1'
    } catch {
      // sessionStorage unavailable (privacy mode, etc.) — just skip the intro
      alreadySeen = true
    }

    if (alreadySeen) return

    setPhase('visible')
    document.body.style.overflow = 'hidden'

    const textDurationMs = WELCOME_WORDS.length * WORD_STAGGER_S * 1000
    const exitTimer = window.setTimeout(() => {
      setPhase('exiting')
    }, textDurationMs + HOLD_AFTER_TEXT_MS)

    return () => window.clearTimeout(exitTimer)
  }, [])

  useEffect(() => {
    if (phase !== 'exiting') return
    const doneTimer = window.setTimeout(() => {
      document.body.style.overflow = ''
      try {
        sessionStorage.setItem(SESSION_KEY, '1')
      } catch {
        // ignore
      }
      setPhase('idle')
    }, EXIT_DURATION_S * 1000)
    return () => window.clearTimeout(doneTimer)
  }, [phase])

  return (
    <AnimatePresence>
      {phase !== 'idle' && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[999] flex items-center justify-center bg-white"
          initial={{ y: 0 }}
          animate={{ y: phase === 'exiting' ? '-100%' : 0 }}
          transition={{ duration: EXIT_DURATION_S, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="px-6 text-center max-w-2xl">
            <p
              dir="rtl"
              lang="ar"
              className="font-sans font-extrabold text-2xl sm:text-4xl leading-relaxed text-neutral-900 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1"
            >
              {WELCOME_WORDS.map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{
                    duration: 0.55,
                    delay: i * WORD_STAGGER_S,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={word === 'الحسين' ? 'text-brand-primary' : undefined}
                >
                  {word}
                </motion.span>
              ))}
            </p>

            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{
                delay: WELCOME_WORDS.length * WORD_STAGGER_S + 0.15,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="h-0.5 w-16 bg-brand-primary mx-auto mt-6 rounded-full origin-center"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
