'use client'

import { Truck, RefreshCcw, ShieldCheck, Tag } from 'lucide-react'
import Marquee from './marquee'

// Rotating short messages shown above the navbar. This is the only piece
// that scrolls with the navbar (see store-layout.tsx) — the brand-logo bar
// lives separately as <InstallmentBrandsBar/>, placed inline between
// homepage sections rather than pinned to the top.
const MESSAGES = [
  { icon: Truck, text: 'شحن سريع لجميع محافظات مصر' },
  { icon: Tag, text: 'عروض لفترة محدودة' },
  { icon: RefreshCcw, text: 'استبدال واسترجاع خلال 14 يوم' },
  { icon: ShieldCheck, text: 'ضمان أصالة 100% معتمد' },
]

export default function TopAnnouncementBar() {
  return (
    <div className="relative w-full select-none bg-inverse-canvas text-white border-b border-white/10">
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
  )
}
