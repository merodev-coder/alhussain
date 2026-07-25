'use client'

import Link from 'next/link'
import { ArrowLeft, Laptop, Shield, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-canvas">
      {/* Background decoration */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, #0FC7C1 0%, transparent 60%), radial-gradient(circle at 80% 20%, #FF7A29 0%, transparent 50%)`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Text */}
          <div className="flex flex-col gap-6 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 bg-surface-2 text-brand-primary px-4 py-2 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
              <span className="font-body text-sm font-medium">استيراد مباشر من المصنع</span>
            </div>

            <h1 className="font-sans font-extrabold text-ink leading-tight text-balance" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
              أقوى اللابتوبات
              <br />
              <span className="text-brand-primary">بأفضل الأسعار</span>
              <br />
              في مصر
            </h1>

            <p className="font-body text-ink-muted text-lg leading-relaxed max-w-lg">
              متجر الحسين للاب توب — متخصصون في استيراد وبيع أجهزة اللاب توب الأصلية بأفضل الأسعار، مع ضمان الجودة وخدمة ما بعد البيع.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/laptops">
                <Button
                  size="lg"
                  className="rounded-full bg-brand-primary hover:bg-brand-primary/90 text-white font-sans font-bold px-8 h-12 active:scale-[0.97] transition-transform gap-2"
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

            {/* Mini trust chips */}
            <div className="flex flex-wrap gap-3 mt-2">
              {[
                { icon: Shield, label: 'ضمان أصلي' },
                { icon: Truck, label: 'توصيل لجميع المحافظات' },
                { icon: Laptop, label: '+500 عميل راضٍ' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 bg-surface-1 px-3 py-1.5 rounded-full">
                  <Icon className="w-4 h-4 text-brand-primary" />
                  <span className="font-body text-xs text-ink-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="order-1 lg:order-2 flex justify-center items-center">
            <div className="relative w-full max-w-md aspect-square">
              {/* Gradient ring */}
              <div
                className="absolute inset-0 rounded-full opacity-20"
                style={{ background: 'linear-gradient(135deg, #0FC7C1 0%, #FF9A52 100%)' }}
              />
              <div className="absolute inset-6 rounded-full bg-surface-1 flex items-center justify-center">
                <div className="absolute inset-10 rounded-full bg-surface-2 flex items-center justify-center">
                  <Laptop className="w-24 h-24 text-brand-primary" strokeWidth={1.2} />
                </div>
              </div>

              {/* Floating stat cards */}
              <div className="absolute top-6 -start-4 bg-canvas rounded-[20px] border border-hairline shadow-md px-4 py-3">
                <p className="font-sans font-extrabold text-2xl text-brand-primary">+500</p>
                <p className="font-body text-xs text-ink-muted">عميل راضٍ</p>
              </div>
              <div className="absolute bottom-10 -end-4 bg-canvas rounded-[20px] border border-hairline shadow-md px-4 py-3">
                <p className="font-sans font-extrabold text-2xl text-brand-accent">+100</p>
                <p className="font-body text-xs text-ink-muted">موديل متاح</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
