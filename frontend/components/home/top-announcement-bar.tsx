'use client'

import { Truck, RefreshCcw, ShieldCheck, Tag } from 'lucide-react'
import Marquee from './marquee'

// Rotating short messages shown above the installment brand logos.
const MESSAGES = [
  { icon: Truck, text: 'شحن سريع لجميع محافظات مصر' },
  { icon: Tag, text: 'عروض لفترة محدودة' },
  { icon: RefreshCcw, text: 'استبدال واسترجاع خلال 14 يوم' },
  { icon: ShieldCheck, text: 'ضمان أصالة 100% معتمد' },
]

// Installment / BNPL partner names, rendered as a continuously scrolling marquee.
const BRAND_LABELS = ['Mylo', 'فرصة FORSA', 'Souhoola', 'Contact', 'valu*', 'أمان']

export default function TopAnnouncementBar() {
  return (
    <div className="w-full select-none">
      {/* Messages marquee */}
      <div className="relative bg-inverse-canvas text-white border-b border-white/10">
        <Marquee durationSec={20} className="py-2">
          {MESSAGES.map((m, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-body font-medium text-white/85 px-5 whitespace-nowrap"
            >
              <m.icon className="w-3.5 h-3.5 text-brand-primary shrink-0" />
              {m.text}
            </span>
          ))}
        </Marquee>
      </div>

      {/* Installment brands marquee */}
      <div className="w-full flex justify-center bg-canvas py-2.5 sm:py-3">
        <div className="w-[95%] rounded-full overflow-hidden bg-gradient-to-l from-[#0A1E2E] via-[#0E2A3D] to-[#0A1E2E] shadow-md">
          <Marquee durationSec={28} reverse className="py-3.5 sm:py-4">
            {BRAND_LABELS.map((brand, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-6 text-white/90 font-sans font-bold text-base sm:text-lg tracking-tight whitespace-nowrap"
              >
                {brand}
                <span className="text-white/20 ms-6">|</span>
              </span>
            ))}
          </Marquee>
        </div>
      </div>
    </div>
  )
}
