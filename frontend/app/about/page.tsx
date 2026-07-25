import Image from 'next/image'
import { Phone, MapPin, Mail, Shield, Truck, Headphones, Award } from 'lucide-react'
import StoreLayout from '@/components/store-layout'

export const metadata = {
  title: 'من نحن - الحسين للاب توب',
  description: 'تعرف على قصة متجر الحسين للاب توب وسبب تميزنا في استيراد وبيع أجهزة اللاب توب في مصر.',
}

const TRUST_POINTS = [
  { icon: Shield, title: 'ضمان الأصالة', desc: 'جميع أجهزتنا أصلية 100% مع ضمان المصنع وفواتير رسمية.' },
  { icon: Truck, title: 'توصيل لكل مصر', desc: 'نوصل لجميع المحافظات المصرية الـ 27 بأسرع وقت.' },
  { icon: Headphones, title: 'دعم ما بعد البيع', desc: 'فريق دعم متاح 7 أيام في الأسبوع لمساعدتك في أي وقت.' },
  { icon: Award, title: 'أسعار تنافسية', desc: 'نستورد مباشرة لنوفر لك أفضل الأسعار في السوق المصري.' },
]

export default function AboutPage() {
  return (
    <StoreLayout>
      {/* Hero */}
      <section className="bg-surface-1 py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.jpeg"
              alt="الحسين للاب توب"
              width={80}
              height={80}
              className="rounded-2xl object-cover"
            />
          </div>
          <h1 className="font-sans font-extrabold text-ink text-4xl mb-4 text-balance">من نحن</h1>
          <p className="font-body text-ink-muted text-lg leading-relaxed max-w-2xl mx-auto">
            متجر الحسين للاب توب — رحلتنا بدأت بهدف واحد: توفير أجهزة اللاب توب الأصلية بأفضل الأسعار للمصريين.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="font-body text-sm text-brand-primary font-medium mb-2">قصتنا</p>
              <h2 className="font-sans font-bold text-ink text-3xl mb-5 text-balance">
                أكثر من 3 سنوات في خدمتك
              </h2>
              <div className="space-y-4 font-body text-ink-muted leading-relaxed">
                <p>
                  بدأنا رحلتنا منذ أكثر من ثلاث سنوات بشغف حقيقي لتوفير أفضل تجربة شراء لأجهزة اللاب توب في السوق المصري. ندرك أن شراء لاب توب قرار مهم، لذلك نحرص دائماً على الشفافية التامة في الأسعار والمواصفات.
                </p>
                <p>
                  نستورد مباشرة من المصانع والموزعين المعتمدين في أوروبا وأمريكا وآسيا، مما يتيح لنا تقديم أسعار لا يستطيع أحد منافستها مع ضمان الجودة الكاملة.
                </p>
                <p>
                  خدمنا أكثر من 500 عميل راضٍ في جميع أنحاء مصر، ونفخر بثقة عملائنا التي تُعد أهم جوائزنا.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '+500', label: 'عميل راضٍ' },
                { value: '+100', label: 'موديل متاح' },
                { value: '3', label: 'سنوات خبرة' },
                { value: '27', label: 'محافظة نوصل لها' },
              ].map(stat => (
                <div key={stat.label} className="bg-surface-1 rounded-[20px] p-6 text-center border border-hairline">
                  <p className="font-sans font-extrabold text-3xl text-brand-primary">{stat.value}</p>
                  <p className="font-body text-sm text-ink-muted mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust points */}
      <section className="bg-surface-1 py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="font-body text-sm text-brand-primary font-medium mb-2">لماذا نحن؟</p>
            <h2 className="font-sans font-bold text-ink text-3xl text-balance">مميزاتنا</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {TRUST_POINTS.map(point => (
              <div key={point.title} className="bg-canvas rounded-[20px] border border-hairline p-6 flex gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                  <point.icon className="w-6 h-6 text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-ink mb-1">{point.title}</h3>
                  <p className="font-body text-sm text-ink-muted leading-relaxed">{point.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-sans font-bold text-ink text-3xl">تواصل معنا</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: Phone,
                label: 'الهاتف',
                value: '01000000000',
                href: 'tel:01000000000',
              },
              {
                icon: () => (
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#25D366]" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                ),
                label: 'واتساب',
                value: '01000000000',
                href: 'https://wa.me/201000000000',
              },
              {
                icon: MapPin,
                label: 'العنوان',
                value: 'القاهرة، مصر',
                href: '#',
              },
            ].map(contact => (
              <a
                key={contact.label}
                href={contact.href}
                target={contact.href.startsWith('http') ? '_blank' : undefined}
                rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="bg-surface-1 rounded-[20px] border border-hairline p-6 text-center flex flex-col items-center gap-3 hover:border-brand-primary/50 hover:bg-surface-2 transition-colors card-hover"
              >
                <div className="w-12 h-12 rounded-full bg-canvas flex items-center justify-center">
                  {typeof contact.icon === 'function' ? (
                    <contact.icon />
                  ) : (
                    <contact.icon className="w-6 h-6 text-brand-primary" />
                  )}
                </div>
                <div>
                  <p className="font-body text-xs text-ink-muted">{contact.label}</p>
                  <p className="font-sans font-bold text-ink">{contact.value}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </StoreLayout>
  )
}
