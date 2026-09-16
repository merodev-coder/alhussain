'use client'

import { Cpu, Wallet, Building2 } from 'lucide-react'
import Marquee from './marquee'

const FEATURES = [
  { icon: Cpu, text: 'أحدث الأجهزة والتكنولوجيا في مكان واحد' },
  { icon: Wallet, text: 'طرق تقسيط مختلفة' },
  { icon: Building2, text: 'حلول متكاملة للشركات والبيزنس' },
]

export default function FeatureTicker() {
  return (
    <section className="w-full bg-surface-2 border-y border-hairline py-4 sm:py-5 overflow-hidden">
      <Marquee durationSec={26}>
        {FEATURES.map((f, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-3 px-8 sm:px-10 whitespace-nowrap"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary shrink-0">
              <f.icon className="w-4.5 h-4.5" />
            </span>
            <span className="font-sans font-bold text-ink text-sm sm:text-base">{f.text}</span>
          </span>
        ))}
      </Marquee>
    </section>
  )
}
