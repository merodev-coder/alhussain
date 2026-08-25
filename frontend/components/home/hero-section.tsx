'use client'

import Link from 'next/link'
import { ArrowLeft, BadgeCheck, Laptop, Layers, Shield, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'

function LaptopMark({ tone = 'active' }) {
  return (
    <div className={tone === 'muted' ? 'opacity-60' : ''}>
      <div className="rounded-t-xl border-[6px] border-b-0 border-ink bg-ink p-1.5">
        <div
          className="aspect-[16/10] rounded-[3px]"
          style={{ background: 'linear-gradient(135deg, #0FC7C1 0%, #FF9A52 100%)' }}
        />
      </div>
      <div className="mx-[-3px] h-2.5 rounded-b-lg bg-ink" />
    </div>
  )
}

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-canvas">
      {/* Background decoration */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 15% 45%, #0FC7C1 0%, transparent 55%), radial-gradient(circle at 85% 15%, #FF7A29 0%, transparent 50%)`,
        }}
      />

      {/* Entrance animation keyframes, scoped to this section */}
      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroSettle {
          from { opacity: 0; transform: translateY(10px) scale(0.94); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes heroStamp {
          0% { opacity: 0; transform: scale(1.5); }
          55% { opacity: 1; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        .hero-fade { animation: heroFadeUp 0.6s ease-out both; }
        .hero-settle { animation: heroSettle 0.7s ease-out both; }
        .hero-stamp { animation: heroStamp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .hero-fade, .hero-settle, .hero-stamp {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Text */}
          <div className="flex flex-col gap-6 order-2 lg:order-1">
            <div className="hero-fade inline-flex items-center gap-2 bg-surface-2 text-brand-primary px-4 py-2 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
              <span className="font-body text-sm font-medium">استيراد مباشر من المصنع</span>
            </div>

            <h1
              className="hero-fade font-sans font-extrabold text-ink leading-tight tracking-tight text-balance"
              style={{ fontSize: 'clamp(2.75rem, 5.5vw, 4.5rem)', animationDelay: '0.08s' }}
            >
              أقوى اللابتوبات
              <br />
              <span className="text-brand-primary">بأفضل الأسعار</span>
              <br />
              في مصر
            </h1>

            <p
              className="hero-fade font-body text-ink-muted text-lg leading-relaxed max-w-lg"
              style={{ animationDelay: '0.16s' }}
            >
              متجر الحسين للاب توب — متخصصون في استيراد وبيع أجهزة اللاب توب الأصلية بأفضل الأسعار، مع ضمان الجودة وخدمة ما بعد البيع.
            </p>

            <div className="hero-fade flex flex-wrap gap-3" style={{ animationDelay: '0.24s' }}>
              <Link href="/laptops">
                <Button
                  size="lg"
                  className="rounded-full bg-brand-primary hover:bg-brand-primary/90 hover:shadow-lg hover:shadow-brand-primary/25 text-white font-sans font-bold px-8 h-12 active:scale-[0.97] transition-all gap-2"
                >
                  تصفح اللابتوبات
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/pricelist">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-hairline bg-canvas text-ink font-sans font-bold px-8 h-12 hover:bg-surface-1 active:scale-[0.97] transition-transform"
                >
                  قائمة الأسعار
                </Button>
              </Link>
            </div>

            {/* Trust chips */}
            <div className="hero-fade flex flex-wrap gap-3 mt-2" style={{ animationDelay: '0.32s' }}>
              {[
                { icon: Shield, label: 'ضمان أصلي' },
                { icon: Truck, label: 'توصيل لجميع المحافظات' },
                { icon: Laptop, label: '+500 عميل راضٍ' },
                { icon: Layers, label: '+100 موديل متاح' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 bg-surface-1 ps-1.5 pe-3 py-1.5 rounded-full">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary/10">
                    <Icon className="w-3.5 h-3.5 text-brand-primary" />
                  </span>
                  <span className="font-body text-xs text-ink-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual — decorative; the facts it echoes (warranty, model count) live in the chips above */}
          <div className="order-1 lg:order-2 flex justify-center items-center" aria-hidden="true">
            <div className="relative w-full max-w-md">
              {/* Ambient glow, echoes the section background */}
              <div className="absolute start-0 top-0 h-28 w-28 rounded-full blur-3xl opacity-30" style={{ background: '#0FC7C1' }} />
              <div className="absolute end-0 bottom-0 h-28 w-28 rounded-full blur-3xl opacity-25" style={{ background: '#FF7A29' }} />

              <div className="relative aspect-[4/3]">
                {/* Back laptop, suggests the wider catalog */}
                <div className="absolute inset-x-10 top-0 rotate-[9deg]">
                  <div className="hero-settle" style={{ animationDelay: '0.1s' }}>
                    <LaptopMark tone="muted" />
                  </div>
                </div>

                {/* Front laptop */}
                <div className="absolute inset-x-4 top-9 rotate-[-5deg] drop-shadow-xl">
                  <div className="hero-settle" style={{ animationDelay: '0.26s' }}>
                    <LaptopMark tone="active" />
                  </div>
                </div>

                {/* Model count */}
                <div className="absolute top-1 end-0 rotate-3">
                  <div
                    className="hero-settle bg-canvas border border-hairline rounded-full px-3 py-1.5 shadow-sm"
                    style={{ animationDelay: '0.42s' }}
                  >
                    <span className="font-sans font-extrabold text-sm text-ink">+100</span>
                    <span className="font-body text-xs text-ink-muted ms-1">موديل</span>
                  </div>
                </div>

                {/* Authenticity stamp — the store's actual promise, not a generic badge */}
                <div className="absolute -bottom-3 start-4 rotate-[-10deg]">
                  <div
                    className="hero-stamp flex h-24 w-24 flex-col items-center justify-center gap-0.5 rounded-full border-2 border-dashed border-brand-accent bg-canvas shadow-lg"
                    style={{ animationDelay: '0.55s' }}
                  >
                    <BadgeCheck className="w-5 h-5 text-brand-accent" strokeWidth={2} />
                    <span className="font-sans font-bold text-[10px] leading-tight text-ink text-center">
                      ضمان
                      <br />
                      أصلي
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
