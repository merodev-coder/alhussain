'use client'

import { useEffect, useRef, useState } from 'react'
import { Shield, Truck, Headphones, Award } from 'lucide-react'
import { StaggerGroup, StaggerItem } from './stagger'
import Reveal from './reveal'

const STATS = [
  { value: 500, suffix: '+', label: 'عميل راضٍ' },
  { value: 100, suffix: '+', label: 'موديل متاح' },
  { value: 3, suffix: ' سنوات', label: 'خبرة في الاستيراد' },
  { value: 27, suffix: '', label: 'محافظة نوصل لها' },
]

const TRUST_POINTS = [
  {
    icon: Award,
    title: 'أسعار تنافسية',
    desc: 'نستورد مباشرة لنوفر لك أفضل الأسعار في السوق المصري.',
  },
  {
    icon: Headphones,
    title: 'دعم ما بعد البيع',
    desc: 'فريق دعم متاح 7 أيام في الأسبوع لمساعدتك في أي وقت.',
  },
  {
    icon: Truck,
    title: 'توصيل لكل مصر',
    desc: 'نوصل لجميع المحافظات المصرية الـ 27 بأسرع وقت.',
  },
  {
    icon: Shield,
    title: 'ضمان الأصالة',
    desc: 'جميع أجهزتنا أصلية 100% مع ضمان المصنع وفواتير رسمية.',
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

        <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TRUST_POINTS.map(point => (
            <StaggerItem key={point.title}>
              <div className="trust-card group relative flex flex-col gap-3 rounded-[22px] border border-hairline bg-canvas p-6 transition-all duration-500 hover:-translate-y-2 hover:border-brand-primary/40 hover:shadow-xl h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 transition-all duration-500 group-hover:-rotate-6 group-hover:bg-brand-primary">
                  <point.icon className="h-6 w-6 text-brand-primary transition-colors duration-500 group-hover:text-white" />
                </div>
                <h3 className="font-sans font-bold text-ink">{point.title}</h3>
                <p className="font-body text-sm text-ink-muted leading-relaxed">{point.desc}</p>
                <span className="pointer-events-none absolute bottom-0 right-6 h-1 w-0 rounded-full bg-brand-primary transition-all duration-500 group-hover:w-10" />
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}
