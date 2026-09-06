'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Phone, MapPin, Mail, ArrowUp, ShieldCheck, ArrowLeft } from 'lucide-react'

const QUICK_LINKS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/laptops', label: 'اللابتوبات' },
  { href: '/pricelist', label: 'قائمة الأسعار' },
  { href: '/about', label: 'من نحن' },
]

const WHATSAPP_ICON_PATH =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'

function scrollToTop() {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

export default function Footer() {
  return (
    <footer className="footer-root relative overflow-hidden bg-inverse-canvas text-white">
      {/* Angled top edge matching the hero / trust section geometry */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-8 sm:h-12 bg-canvas"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 100%)' }}
      />

      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute -top-10 right-1/4 h-64 w-64 rounded-full bg-brand-primary/20 blur-3xl animate-blob-drift" />
      <div className="pointer-events-none absolute bottom-0 left-1/5 h-72 w-72 rounded-full bg-brand-accent/10 blur-3xl animate-blob-drift-slow" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 46px)',
        }}
      />

      {/* CTA band */}
      <div className="relative border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="footer-cta flex flex-col sm:flex-row items-center justify-between gap-5 rounded-[28px] border border-white/10 bg-white/5 px-6 py-6 sm:px-10 sm:py-8 backdrop-blur-sm">
            <div className="text-center sm:text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/15 text-brand-primary border border-brand-primary/30 text-xs font-bold mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>استيراد مباشر — ضمان حقيقي</span>
              </div>
              <h3 className="font-sans font-extrabold text-xl sm:text-2xl text-white">
                محتار تختار أي جهاز؟ فريقنا هيساعدك دلوقتي
              </h3>
            </div>
            <a
              href="https://wa.me/201000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-cta-btn shrink-0 inline-flex items-center gap-2 rounded-2xl bg-brand-primary px-6 py-3.5 font-sans font-bold text-white shadow-lg transition-all duration-300 hover:brightness-110 hover:-translate-y-0.5 active:scale-95"
            >
              <span>تواصل معنا على واتساب</span>
              <ArrowLeft className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.jpeg"
                alt="الحسين للاب توب"
                width={44}
                height={44}
                className="rounded-xl object-cover"
              />
              <span className="font-sans font-bold text-lg text-white">الحسين للاب توب</span>
            </div>
            <p className="font-body text-sm text-white/60 leading-relaxed">
              متخصصون في استيراد وبيع أجهزة اللاب توب الأصلية بأفضل الأسعار في مصر. خدمة ما بعد البيع وضمان على جميع المنتجات.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <a
                href="https://wa.me/201000000000"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="واتساب"
                className="footer-social-icon flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-all duration-300 hover:bg-[#25D366] hover:-translate-y-1 hover:rotate-6"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d={WHATSAPP_ICON_PATH} />
                </svg>
              </a>
              <a
                href="#"
                aria-label="فيسبوك"
                className="footer-social-icon flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-all duration-300 hover:bg-brand-primary hover:-translate-y-1 hover:rotate-6"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="#"
                aria-label="انستجرام"
                className="footer-social-icon flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-all duration-300 hover:bg-pink-600 hover:-translate-y-1 hover:rotate-6"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-sans font-bold text-white mb-4 relative inline-block">
              روابط سريعة
              <span className="absolute -bottom-2 right-0 h-0.5 w-8 rounded-full bg-brand-primary" />
            </h3>
            <ul className="space-y-2 mt-3">
              {QUICK_LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="footer-link group inline-flex items-center gap-1.5 font-body text-sm text-white/60 hover:text-brand-primary transition-colors"
                  >
                    <span className="h-1 w-1 rounded-full bg-brand-primary/0 transition-all duration-300 group-hover:bg-brand-primary group-hover:w-2.5" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-sans font-bold text-white mb-4 relative inline-block">
              تواصل معنا
              <span className="absolute -bottom-2 right-0 h-0.5 w-8 rounded-full bg-brand-primary" />
            </h3>
            <ul className="space-y-3 mt-3">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                <span className="font-body text-sm text-white/60">01000000000</span>
              </li>
              <li className="flex items-start gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#25D366] mt-0.5 shrink-0 fill-[#25D366]" xmlns="http://www.w3.org/2000/svg">
                  <path d={WHATSAPP_ICON_PATH} />
                </svg>
                <a href="https://wa.me/201000000000" className="font-body text-sm text-white/60 hover:text-[#25D366] transition-colors">
                  واتساب: 01000000000
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                <span className="font-body text-sm text-white/60">القاهرة، مصر</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                <span className="font-body text-sm text-white/60">info@alhussein-laptop.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-body text-xs text-white/40">
            © {new Date().getFullYear()} الحسين للاب توب. جميع الحقوق محفوظة.
          </p>
          <p className="font-body text-xs text-white/40">
            استيراد أجهزة لاب توب أصلية بأفضل الأسعار
          </p>
        </div>
      </div>

      {/* Back to top */}
      <button
        onClick={scrollToTop}
        aria-label="العودة لأعلى الصفحة"
        className="footer-top-btn group absolute bottom-6 left-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:brightness-110 active:scale-95"
      >
        <ArrowUp className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
      </button>
    </footer>
  )
}
