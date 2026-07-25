'use client'

import { useEffect, useRef, useState } from 'react'
import { Shield, Truck, Headphones, Award, Users, Clock } from 'lucide-react'

const STATS = [
  { value: 500, suffix: '+', label: 'عميل راضٍ' },
  { value: 100, suffix: '+', label: 'موديل متاح' },
  { value: 3, suffix: ' سنوات', label: 'خبرة في الاستيراد' },
  { value: 27, suffix: '', label: 'محافظة نوصل لها' },
]

const TRUST_POINTS = [
  {
    icon: Shield,
    title: 'ضمان الأصالة',
    desc: 'جميع أجهزتنا أصلية 100% مع ضمان المصنع وفواتير رسمية.',
  },
  {
    icon: Truck,
    title: 'توصيل لكل مصر',
    desc: 'نوصل لجميع المحافظات المصرية الـ 27 بأسرع وقت.',
  },
  {
    icon: Headphones,
    title: 'دعم ما بعد البيع',
    desc: 'فريق دعم متاح 7 أيام في الأسبوع لمساعدتك في أي وقت.',
  },
  {
    icon: Award,
    title: 'أسعار تنافسية',
    desc: 'نستورد مباشرة لنوفر لك أفضل الأسعار في السوق المصري.',
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
    <section className="bg-surface-1 py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {STATS.map(stat => (
            <div
              key={stat.label}
              className="bg-canvas rounded-[20px] border border-hairline p-6 text-center card-hover"
            >
              <p className="font-sans font-extrabold text-3xl text-brand-primary">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="font-body text-sm text-ink-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Trust points */}
        <div className="text-center mb-8">
          <p className="font-body text-sm text-brand-primary font-medium mb-1">لماذا نحن؟</p>
          <h2 className="font-sans font-bold text-ink text-3xl text-balance">
            لماذا تختار الحسين للاب توب؟
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TRUST_POINTS.map(point => (
            <div
              key={point.title}
              className="bg-canvas rounded-[20px] border border-hairline p-6 flex flex-col gap-3 card-hover"
            >
              <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
                <point.icon className="w-6 h-6 text-brand-primary" />
              </div>
              <h3 className="font-sans font-bold text-ink">{point.title}</h3>
              <p className="font-body text-sm text-ink-muted leading-relaxed">{point.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
