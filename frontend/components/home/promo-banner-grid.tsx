'use client'

import Image from 'next/image'
import Link from 'next/link'
import Reveal from './reveal'

type PromoTile = {
  src: string
  alt: string
  href: string
  area: string
}

// Four promo banners shown right under "وصل حديثاً", laid out the same way
// as the reference: two small tiles stacked on the far side, one tall
// tile next to them, and one large wide tile spanning the rest.
const TILES: PromoTile[] = [
  { src: '/promo/banners/printers-projector.png', alt: 'الطابعات والبروجيكتر', href: '/category/monitors', area: 'top-left' },
  { src: '/promo/banners/sound-system.png', alt: 'ساوند سيستم', href: '/category/monitors', area: 'bottom-left' },
  { src: '/promo/banners/storage-space.webp', alt: 'مساحة تكفي كل احتياجاتك', href: '/category/storage', area: 'middle' },
  { src: '/promo/banners/build-your-pc.png', alt: 'جمّع جهاز أحلامك', href: '/laptops', area: 'wide' },
]

export default function PromoBannerGrid() {
  return (
    <Reveal direction="scale" className="w-full py-8 sm:py-10">
      <div className="w-full px-2 sm:px-4">
        <div
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:h-[420px] lg:grid-cols-[1fr_1fr_2fr] lg:grid-rows-2"
          style={{
            gridTemplateAreas: `"top-left middle wide" "bottom-left middle wide"`,
          }}
        >
          {TILES.map(tile => (
            <Link
              key={tile.src}
              href={tile.href}
              className="group relative overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ gridArea: tile.area }}
            >
              <div className="relative h-full min-h-[160px] w-full lg:min-h-0">
                <Image
                  src={tile.src}
                  alt={tile.alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Reveal>
  )
}

