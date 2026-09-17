'use client'

import { useEffect, useRef, useState } from 'react'
import { StaggerGroup, StaggerItem } from './stagger'
import Reveal from './reveal'

const STATS = [
  { value: 500, suffix: '+', label: 'عميل راضٍ' },
  { value: 100, suffix: '+', label: 'موديل متاح' },
  { value: 3, suffix: ' سنوات', label: 'خبرة في الاستيراد' },
  { value: 27, suffix: '', label: 'محافظة نوصل لها' },
]

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

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true
          let start = 0
          const duration = 1200
          const step = 16
          const increment = target / (duration / step)
          const timer = setInterval(() => {
            start += increment
            if (start >= target) {
              setCount(target)
              clearInterval(timer)
            } else {
              setCount(Math.floor(start))
            }
          }, step)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count}{suffix}</span>
}

export default function TrustSection() {
  return (
    <section className="trust-section relative overflow-hidden bg-surface-1 py-16 sm:py-20">
      {/* Angled top divider echoing the hero's cut corners */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-10 bg-canvas"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0 100%)' }}
      />

      {/* Ambient drifting glow blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-primary/10 blur-3xl animate-blob-drift" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-brand-accent/10 blur-3xl animate-blob-drift-slow" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats row */}
        <StaggerGroup className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {STATS.map(stat => (
            <StaggerItem key={stat.label}>
              <div className="stat-tile relative overflow-hidden rounded-[22px] border border-hairline bg-canvas p-6 text-center">
                <div className="pointer-events-none absolute -left-6 -top-6 h-16 w-16 rounded-full bg-brand-primary/10" />
                <p className="relative font-sans font-extrabold text-3xl sm:text-4xl text-brand-primary">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="relative font-body text-sm text-ink-muted mt-1">{stat.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>

        {/* Trust points */}
        <Reveal className="text-center mb-10">
          <span className="inline-block font-body text-xs sm:text-sm text-brand-primary font-bold tracking-wide mb-2 px-3 py-1 rounded-full bg-brand-primary/10">
            لماذا نحن؟
          </span>
          <h2 className="font-sans font-extrabold text-ink text-2xl sm:text-3xl lg:text-4xl text-balance">
            لماذا تختار الحسين للاب توب؟
          </h2>
        </Reveal>

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
                className={`trust-card group relative flex min-w-0 items-center gap-4 overflow-hidden rounded-[26px] border px-5 py-7 sm:py-8 transition-[flex-grow,transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none ${
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
