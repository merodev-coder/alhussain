'use client'

import Marquee from './marquee'

// Installment / BNPL partner names, rendered as a continuously scrolling
// marquee. Placed inline between homepage product sections — not sticky,
// not pinned to the top (unlike TopAnnouncementBar), full width with square
// corners rather than a floating rounded pill.
const BRAND_LABELS = ['Mylo', 'فرصة FORSA', 'Souhoola', 'Contact', 'valu*', 'أمان']

export default function InstallmentBrandsBar() {
  return (
    <div className="relative w-full select-none bg-gradient-to-l from-[#0A1E2E] via-[#0E2A3D] to-[#0A1E2E] shadow-md">
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
  )
}
