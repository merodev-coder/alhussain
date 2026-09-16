'use client'

import Image from 'next/image'
import Reveal from './reveal'
import { StaggerGroup, StaggerItem } from './stagger'

export default function InstallmentBanner() {
  return (
    <Reveal direction="scale" className="w-full py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[24px] sm:rounded-[28px] overflow-hidden shadow-xl">
          <Image
            src="/promo/installment-banner.webp"
            alt="اشتري وادفع على مهلك"
            width={1400}
            height={330}
            className="w-full h-auto object-cover"
            sizes="(max-width: 1024px) 100vw, 1400px"
          />
        </div>
      </div>
    </Reveal>
  )
}

const PERKS = [
  { src: '/promo/fast-shipping.webp', alt: 'شحن سريع وآمن حتى باب المنزل' },
  { src: '/promo/authentic-products.webp', alt: 'منتجات أصلية 100% بضمان معتمد' },
  { src: '/promo/exchange-14-days.webp', alt: 'استبدال واسترجاع خلال 14 يوم' },
  { src: '/promo/bulk-pricing.webp', alt: 'أسعار خاصة للكميات والجملة' },
]

export function PerksStrip() {
  return (
    <section className="w-full py-10 sm:py-14">
      <div className="w-full px-3 sm:px-6 lg:px-10">
        <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-7 lg:gap-8">
          {PERKS.map(perk => (
            <StaggerItem key={perk.src}>
              <div className="relative rounded-[24px] overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300">
                <Image
                  src={perk.src}
                  alt={perk.alt}
                  width={800}
                  height={418}
                  className="w-full h-auto object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}
