import Link from 'next/link'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PromoSection() {
  return (
    <section className="py-14 bg-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-[30px] p-8 md:p-12 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0FC7C1 0%, #FF9A52 100%)' }}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 end-0 w-64 h-64 rounded-full bg-white" style={{ transform: 'translate(30%, -30%)' }} />
            <div className="absolute bottom-0 start-0 w-48 h-48 rounded-full bg-white" style={{ transform: 'translate(-20%, 30%)' }} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex flex-col gap-4 text-center md:text-start">
              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full w-fit mx-auto md:mx-0">
                <Zap className="w-4 h-4 text-white" />
                <span className="font-body text-sm text-white font-medium">عروض محدودة</span>
              </div>
              <h2 className="font-sans font-extrabold text-white text-3xl md:text-4xl text-balance">
                خصومات حصرية على
                <br />
                أفضل الموديلات
              </h2>
              <p className="font-body text-white/80 text-lg max-w-md">
                وفر أكثر مع عروضنا الموسمية على أجهزة اللاب توب الأصلية المستوردة — خصومات تصل لـ 20% على موديلات مختارة.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="bg-white/20 rounded-[20px] px-8 py-5 text-center">
                <p className="font-body text-white/80 text-sm">خصم يصل إلى</p>
                <p className="font-sans font-extrabold text-white text-5xl">20%</p>
                <p className="font-body text-white/80 text-sm">على موديلات مختارة</p>
              </div>
              <Link href="/laptops">
                <Button
                  size="lg"
                  className="rounded-full bg-white text-ink font-sans font-bold hover:bg-white/90 px-8 active:scale-[0.97] transition-transform"
                >
                  تسوق الآن
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
