'use client'

import Image from 'next/image'
import Link from 'next/link'
import Reveal from './reveal'

type PromoTile = {
  src: string
  alt: string
  href: string
  width: number
  height: number
}

// Four promo banners shown right under "وصل حديثاً" — a quick visual jump-off
// point into a few of the store's categories, styled the same way the rest
// of the homepage's promo art is (rounded tiles, soft shadow, hover lift).
const TILES: PromoTile[] = [
  { src: '/promo/banners/build-pc.jpg', alt: 'جمّع جهاز أحلامك', href: '/category/storage', width: 1398, height: 768 },
  { src: '/promo/banners/storage.jpg', alt: 'مساحة تخزين تكفي كل احتياجاتك', href: '/category/storage', width: 1380, height: 752 },
  { src: '/promo/banners/choose-workstation.jpg', alt: 'اختار محطة عملك', href: '/laptops', width: 1380, height: 752 },
  { src: '/promo/banners/printers-sound.webp', alt: 'طابعات وبروجيكتور وساوند سيستم', href: '/category/batteries', width: 627, height: 694 },
]

export default function PromoBannerGrid() {
  return (
    <Reveal direction="scale" className="w-full py-8 sm:py-10">
      <div className="w-full px-2 sm:px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {TILES.map(tile => (
            <Link
              key={tile.src}
              href={tile.href}
              className="group relative overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
            >
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={tile.src}
                  alt={tile.alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
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
