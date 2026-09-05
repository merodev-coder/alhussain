'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, ShieldCheck, Truck, BadgeCheck } from 'lucide-react'
import type { HeroSlide } from '@/lib/types'

const FALLBACK: Partial<HeroSlide> = { headline: 'أجهزة أقوى.\nاختيار أذكى.', subtitle: 'لابتوبات استيراد فرز أول، مجرّبة ومضمونة، بأسعار مصممة لتناسب شغلك ودراستك.', buttonText: 'اكتشف المجموعة', buttonLink: '/laptops', images: ['https://images.unsplash.com/photo-1593642532744-d377ab507dc8?auto=format&fit=crop&w=1800&q=88'] }

export default function HeroSection({ slides = [] }: { slides?: HeroSlide[] }) {
  const [active, setActive] = useState(0)
  const items = slides.filter(slide => slide.isActive).length ? slides.filter(slide => slide.isActive) : [FALLBACK as HeroSlide]
  const slide = items[active % items.length]
  const image = slide.images?.[0] || FALLBACK.images![0]
  useEffect(() => { if (items.length < 2) return; const timer = window.setInterval(() => setActive(value => (value + 1) % items.length), 6500); return () => window.clearInterval(timer) }, [items.length])

  return <section className="relative overflow-hidden bg-[#071426] text-white">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(15,199,193,.22),transparent_32%),linear-gradient(110deg,#071426_18%,rgba(7,20,38,.72),#0d3d67)]" />
    <div className="relative mx-auto grid min-h-[540px] max-w-[1440px] grid-cols-1 items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:px-14 lg:py-16">
      <div className="order-2 flex flex-col gap-6 lg:order-1">
        <div className="flex items-center gap-2 text-xs font-bold tracking-[.2em] text-cyan-200"><span className="size-2 rounded-full bg-[#0FC7C1]" /> ALHUSSAIN COMPUTER</div>
        <h1 className="max-w-xl whitespace-pre-line font-sans text-4xl font-black leading-[1.12] tracking-tight sm:text-6xl">{slide.headline || FALLBACK.headline}</h1>
        <p className="max-w-lg text-base leading-8 text-slate-300 sm:text-lg">{slide.subtitle || FALLBACK.subtitle}</p>
        <div className="flex flex-wrap gap-3"><Link href={slide.buttonLink || '/laptops'} className="inline-flex h-12 items-center gap-3 rounded-xl bg-[#0FC7C1] px-7 font-sans font-bold text-[#071426] shadow-lg transition hover:bg-cyan-200">{slide.buttonText || FALLBACK.buttonText}<ArrowLeft className="size-4" /></Link><Link href="/price-list" className="inline-flex h-12 items-center rounded-xl border border-white/20 px-7 font-sans font-bold text-white transition hover:bg-white/10">قائمة الأسعار</Link></div>
        <div className="mt-3 flex flex-wrap gap-5 border-t border-white/10 pt-5 text-sm text-slate-300"><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#0FC7C1]" /> ضمان حقيقي</span><span className="flex items-center gap-2"><Truck className="size-4 text-[#0FC7C1]" /> شحن لكل مصر</span><span className="flex items-center gap-2"><BadgeCheck className="size-4 text-[#0FC7C1]" /> فحص قبل الشحن</span></div>
      </div>
      <div className="order-1 lg:order-2"><div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur-sm"><div className="relative aspect-[1.35/1] overflow-hidden rounded-[1.5rem] bg-slate-900"><Image src={image} alt={slide.headline || 'أجهزة الحسين للاب توب'} fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover transition-transform duration-700 hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#071426]/60 via-transparent to-transparent" /></div><div className="absolute bottom-7 start-7 rounded-xl border border-white/15 bg-[#071426]/80 px-4 py-3 backdrop-blur-md"><span className="block text-[10px] tracking-widest text-cyan-200">CURATED FOR YOU</span><span className="font-sans text-sm font-bold">اختيارات تستحق التجربة</span></div></div>{items.length > 1 && <div className="mt-5 flex items-center justify-between"><div className="flex gap-2">{items.map((item, index) => <button key={item.id || index} onClick={() => setActive(index)} aria-label={`الشريحة ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === active ? 'w-10 bg-[#0FC7C1]' : 'w-4 bg-white/30'}`} />)}</div><div className="flex gap-2"><button onClick={() => setActive((active - 1 + items.length) % items.length)} className="rounded-full border border-white/15 p-2 hover:bg-white/10" aria-label="السابق"><ChevronRight className="size-4" /></button><button onClick={() => setActive((active + 1) % items.length)} className="rounded-full border border-white/15 p-2 hover:bg-white/10" aria-label="التالي"><ChevronLeft className="size-4" /></button></div></div>}</div>
    </div>
  </section>
}
