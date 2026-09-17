'use client'

import { useState } from 'react'
import Reveal from './reveal'

// The 5 feature cards below. "dark" alternates true/false so the row reads
// dark-light-dark-light-dark, and each gif is a small looping animated icon
// (played natively by the <img> tag) rather than a static lucide icon.
const TRUST_POINTS = [
  {
    gif: '/icons/trust/return-policy.gif',
    title: 'سياسة استرجاع واستبدال سهلة',
    desc: 'استرجاع خلال 48 ساعة بدون تعقيد، واستبدال خلال 14 يومًا وفق سياسة واضحة وبسيطة.',
    dark: true,
  },
  {
    gif: '/icons/trust/happy-customers.gif',
    title: '500+ عميل سعيد',
    desc: 'مئات العملاء وثقوا فينا، وبنكمل بنفس مستوى الجودة والخدمة مع كل جهاز بنبيعه.',
    dark: false,
  },
  {
    gif: '/icons/trust/support-247.gif',
    title: 'فحص كامل ودعم ما بعد البيع',
    desc: 'كل جهاز بيتفحص بعناية قبل التسليم، مع دعم فني مستمر لضمان أفضل أداء ليك.',
    dark: true,
  },
  {
    gif: '/icons/trust/warranty.gif',
    title: 'ضمان حتى سنة كاملة',
    desc: 'كل جهاز بييجي بضمان بيوصل لسنة كاملة، عشان تستمتع براحة بال وأداء موثوق.',
    dark: false,
  },
  {
    gif: '/icons/trust/delivery.gif',
    title: 'توصيل لأي مكان في مصر',
    desc: 'توصيل سريع وآمن لكل محافظات مصر، بترتيبات مرنة تناسب جدولك.',
    dark: true,
  },
]

export default function TrustSection() {
  return (
    <section
      className="trust-section relative overflow-hidden py-16 sm:py-20"
      style={{
        background: 'linear-gradient(120deg, #FBF1E9 0%, #F3F7F5 45%, #E9F7F6 100%)',
      }}
    >
      {/* Angled top divider echoing the hero's cut corners */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-10 bg-canvas"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0 100%)' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center mb-10">
          <span className="inline-block font-body text-xs sm:text-sm text-brand-primary font-bold tracking-wide mb-2 px-3 py-1 rounded-full bg-brand-primary/10">
            لماذا نحن؟
          </span>
          <h2 className="font-sans font-extrabold text-ink text-2xl sm:text-3xl lg:text-4xl text-balance">
            لماذا تختار الحسين للاب توب؟
          </h2>
        </Reveal>
      </div>

      {/* Full width, not capped to the max-w-7xl container, so the row uses
          the whole section instead of leaving space at the edges. */}
      <div className="relative w-full px-4 sm:px-6 lg:px-10">
        <TrustCardsRow />
      </div>
    </section>
  )
}

function TrustCardsRow() {
  const [hovered, setHovered] = useState<number | null>(null)
  const [everHovered, setEverHovered] = useState(false)

  return (
    <div className="relative">
      {/* A one-time hint that this row is interactive, matching the reference
          design's floating "Hover" pill — it fades away for good the first
          time someone actually hovers a card. */}
      <div
        className={`pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1 text-xs font-body text-white shadow-lg transition-opacity duration-700 ${
          everHovered ? 'opacity-0' : 'opacity-100 animate-hint-bounce'
        }`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
        مرّر بالماوس
      </div>

      {/* On mobile (where hover doesn't really exist) this just stacks as a
          normal vertical list of cards. On sm+ it becomes the horizontal
          hover-to-expand accordion. */}
      <Reveal direction="up" className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch">
        {TRUST_POINTS.map((point, idx) => {
          const isHovered = hovered === idx
          return (
              <div
                key={point.title}
                onMouseEnter={() => {
                  setHovered(idx)
                  setEverHovered(true)
                }}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => {
                  setHovered(idx)
                  setEverHovered(true)
                }}
                onBlur={() => setHovered(null)}
                tabIndex={0}
                style={{ flexGrow: isHovered ? 3.4 : 1, flexBasis: 0 }}
                className={`trust-card group relative flex h-[184px] sm:h-[204px] min-w-0 items-center gap-4 overflow-hidden rounded-[26px] border px-5 transition-[flex-grow,transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none ${
                  point.dark
                    ? 'bg-ink border-ink text-white'
                    : 'bg-canvas border-hairline text-ink'
                } ${isHovered ? 'shadow-2xl sm:z-10' : 'hover:shadow-lg'}`}
              >
                {/* faint technical dot-grid + ring pattern, echoing the reference cards */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
                    backgroundSize: '14px 14px',
                  }}
                />
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full border-2 transition-transform duration-700 ${
                    point.dark ? 'border-brand-primary/20' : 'border-brand-primary/15'
                  } ${isHovered ? 'scale-125 rotate-45' : 'scale-100'}`}
                />

                {/* Icon — same <img> element persists across states so the gif never restarts */}
                <div
                  className={`relative shrink-0 transition-all duration-500 ${
                    isHovered ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-10 h-10'
                  }`}
                >
                  <img
                    src={point.gif}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>

                {/* Text */}
                <div className="relative min-w-0 flex-1">
                  <p
                    className={`font-body text-xs sm:text-sm leading-relaxed transition-all duration-500 overflow-hidden ${
                      point.dark ? 'text-white/70' : 'text-ink-muted'
                    } ${isHovered ? 'max-h-24 opacity-100 mb-2' : 'max-h-0 opacity-0 mb-0'}`}
                  >
                    {point.desc}
                  </p>
                  <p
                    className={`font-sans font-bold leading-snug transition-all duration-500 ${
                      isHovered ? 'text-base sm:text-lg' : 'text-sm sm:text-[15px]'
                    }`}
                  >
                    {point.title}
                  </p>
                </div>
              </div>
          )
        })}
      </Reveal>
    </div>
  )
}
