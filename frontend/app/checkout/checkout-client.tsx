'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Truck, Store, Upload, MapPin, CheckCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCart } from '@/lib/cart-context'
import { EGYPT_GOVERNORATES } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

type FormData = {
  name: string
  phone: string
  address: string
  governorate: string
  deliveryMethod: 'shipping' | 'pickup'
  depositFile: File | null
}

type Errors = Partial<Record<keyof FormData, string>>

function validate(form: FormData): Errors {
  const errors: Errors = {}
  if (!form.name.trim()) errors.name = 'الاسم مطلوب'
  if (!form.phone.trim()) errors.phone = 'رقم الهاتف مطلوب'
  else if (!/^01[0-9]{9}$/.test(form.phone.trim())) errors.phone = 'رقم الهاتف غير صحيح'
  if (form.deliveryMethod === 'shipping') {
    if (!form.address.trim()) errors.address = 'العنوان مطلوب'
    if (!form.governorate) errors.governorate = 'المحافظة مطلوبة'
  }
  return errors
}

export default function CheckoutClient() {
  const { items, total, clearCart } = useCart()
  const [form, setForm] = useState<FormData>({
    name: '',
    phone: '',
    address: '',
    governorate: '',
    deliveryMethod: 'shipping',
    depositFile: null,
  })
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const [orderId, setOrderId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')

  const set = (field: keyof FormData, value: string | File | null) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setIsLoading(true)
    setSubmitError('')

    try {
      // Upload deposit photo if provided
      let depositPhotoUrl: string | undefined
      if (form.depositFile) {
        const formData = new FormData()
        formData.append('files', form.depositFile)
        const uploadRes = await fetch('/api/uploadthing', {
          method: 'POST',
          body: formData,
        })
        const uploadData = await uploadRes.json()
        depositPhotoUrl = uploadData.files?.[0]?.url
      }

      // Create order via backend API
      const orderData = {
        customerName: form.name,
        phone: form.phone,
        address: form.address,
        governorate: form.governorate,
        deliveryMethod: form.deliveryMethod,
        depositPhotoUrl,
        items: items.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          qty: item.qty,
        })),
        total: total,
      }

      const response = await api.create_order(orderData)
      setOrderId(response.id || response.orderNumber)
      setSubmitted(true)
      clearCart()
    } catch (error) {
      console.error('[v0] Order submission error:', error)
      setSubmitError(error instanceof Error ? error.message : 'حدث خطأ في إرسال الطلب')
    } finally {
      setIsLoading(false)
    }
  }

  if (items.length === 0 && !submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-surface-1 flex items-center justify-center">
          <Store className="w-8 h-8 text-ink-muted" />
        </div>
        <h2 className="font-sans font-bold text-ink text-xl">السلة فارغة</h2>
        <p className="font-body text-ink-muted text-sm">أضف منتجات للسلة أولاً قبل إتمام الطلب.</p>
        <Link href="/laptops">
          <Button className="rounded-full bg-brand-primary text-white hover:bg-brand-primary/90 font-sans font-bold">
            تصفح اللابتوبات
          </Button>
        </Link>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <div>
          <h2 className="font-sans font-extrabold text-ink text-2xl mb-2">تم استلام طلبك!</h2>
          <p className="font-body text-ink-muted">رقم الطلب: <span className="font-bold text-brand-primary">{orderId}</span></p>
        </div>
        <div className="bg-surface-1 rounded-[20px] p-6 w-full text-start">
          <p className="font-body text-ink leading-relaxed">
            شكراً لك! تم استلام طلبك بنجاح. سيتواصل معك فريقنا عبر <strong>الهاتف أو واتساب</strong> في أقرب وقت لتأكيد الطلب وترتيب التسليم.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <a
            href="https://wa.me/201000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 rounded-full bg-[#25D366] text-white font-sans font-bold text-center flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            تواصل عبر واتساب
          </a>
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full rounded-full border-hairline font-sans font-bold">
              الرئيسية
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 font-body text-sm text-ink-muted mb-8">
        <Link href="/" className="hover:text-brand-primary transition-colors">الرئيسية</Link>
        <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        <span className="text-ink">إتمام الطلب</span>
      </nav>

      <h1 className="font-sans font-bold text-ink text-3xl mb-8">إتمام الطلب</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Personal info */}
            <div className="bg-canvas border border-hairline rounded-[20px] p-6">
              <h2 className="font-sans font-bold text-ink text-lg mb-5">بيانات التواصل</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="font-body text-sm text-ink">الاسم الكامل *</Label>
                  <Input
                    id="name"
                    placeholder="مثال: أحمد محمد"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    className={cn('rounded-xl border-hairline focus-visible:ring-[#0FC7C1]/30 font-body', errors.name && 'border-red-400')}
                  />
                  {errors.name && <p className="font-body text-xs text-red-500">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="font-body text-sm text-ink">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    placeholder="01xxxxxxxxx"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    className={cn('rounded-xl border-hairline focus-visible:ring-[#0FC7C1]/30 font-body', errors.phone && 'border-red-400')}
                    inputMode="tel"
                  />
                  {errors.phone && <p className="font-body text-xs text-red-500">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Delivery method */}
            <div className="bg-canvas border border-hairline rounded-[20px] p-6">
              <h2 className="font-sans font-bold text-ink text-lg mb-5">طريقة الاستلام</h2>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {([
                  { value: 'shipping', label: 'شحن للمنزل', icon: Truck },
                  { value: 'pickup', label: 'استلام من المتجر', icon: Store },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('deliveryMethod', opt.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-[20px] border-2 transition-all',
                      form.deliveryMethod === opt.value
                        ? 'border-brand-primary bg-surface-2'
                        : 'border-hairline bg-canvas hover:bg-surface-1'
                    )}
                  >
                    <opt.icon className={cn('w-6 h-6', form.deliveryMethod === opt.value ? 'text-brand-primary' : 'text-ink-muted')} />
                    <span className={cn('font-sans font-semibold text-sm', form.deliveryMethod === opt.value ? 'text-brand-primary' : 'text-ink')}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>

              {form.deliveryMethod === 'shipping' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="font-body text-sm text-ink">العنوان التفصيلي *</Label>
                    <Input
                      id="address"
                      placeholder="مثال: شارع التحرير، مبنى 5، شقة 12"
                      value={form.address}
                      onChange={e => set('address', e.target.value)}
                      className={cn('rounded-xl border-hairline focus-visible:ring-[#0FC7C1]/30 font-body', errors.address && 'border-red-400')}
                    />
                    {errors.address && <p className="font-body text-xs text-red-500">{errors.address}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="governorate" className="font-body text-sm text-ink">المحافظة *</Label>
                    <select
                      id="governorate"
                      value={form.governorate}
                      onChange={e => set('governorate', e.target.value)}
                      className={cn(
                        'w-full rounded-xl border px-3 py-2.5 font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30 transition-shadow',
                        errors.governorate ? 'border-red-400' : 'border-hairline',
                        !form.governorate && 'text-ink-muted'
                      )}
                    >
                      <option value="" disabled>اختر المحافظة</option>
                      {EGYPT_GOVERNORATES.map(gov => (
                        <option key={gov} value={gov}>{gov}</option>
                      ))}
                    </select>
                    {errors.governorate && <p className="font-body text-xs text-red-500">{errors.governorate}</p>}
                  </div>

                  {/* Payment instructions */}
                  <div className="bg-surface-1 rounded-[20px] p-4 mt-2">
                    <h4 className="font-sans font-bold text-ink text-sm mb-2">تعليمات الدفع</h4>
                    <p className="font-body text-xs text-ink-muted leading-relaxed">
                      يرجى تحويل مقدم الحجز إلى أحد الحسابات التالية:<br />
                      <strong>حساب بنك مصر:</strong> 0123456789012345<br />
                      <strong>InstaPay:</strong> 01000000000@instapay<br />
                      ثم ارفع صورة إيصال الإيداع أدناه.
                    </p>
                  </div>

                  {/* Deposit upload */}
                  <div className="space-y-1.5">
                    <Label className="font-body text-sm text-ink">صورة إيصال الإيداع</Label>
                    <label className="flex flex-col items-center gap-2 border-2 border-dashed border-hairline rounded-[20px] p-6 cursor-pointer hover:border-brand-primary/50 hover:bg-surface-1 transition-colors">
                      <Upload className="w-6 h-6 text-ink-muted" />
                      <span className="font-body text-sm text-ink-muted">
                        {form.depositFile ? form.depositFile.name : 'اضغط لرفع صورة الإيصال'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => set('depositFile', e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                </div>
              )}

              {form.deliveryMethod === 'pickup' && (
                <div className="space-y-3">
                  <div className="bg-surface-1 rounded-[20px] p-4 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-brand-primary mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-sans font-bold text-ink text-sm">عنوان المتجر</h4>
                      <p className="font-body text-sm text-ink-muted mt-1">القاهرة، مصر — شارع مثال، رقم المبنى 1</p>
                      <p className="font-body text-xs text-ink-muted mt-0.5">أوقات العمل: 9 صباحاً - 9 مساءً</p>
                    </div>
                  </div>
                  <div className="bg-surface-1 rounded-[20px] h-40 flex items-center justify-center border border-hairline">
                    <div className="flex flex-col items-center gap-2 text-ink-muted">
                      <MapPin className="w-8 h-8" />
                      <span className="font-body text-sm">الخريطة ستظهر هنا</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-canvas border border-hairline rounded-[20px] p-6 sticky top-24">
              <h2 className="font-sans font-bold text-ink text-lg mb-4">ملخص الطلب</h2>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.product.id} className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-1 shrink-0">
                      <Image
                        src={item.product.photos[0]}
                        alt={item.product.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-xs text-ink font-semibold line-clamp-2">{item.product.name}</p>
                      <p className="font-body text-xs text-ink-muted">× {item.qty}</p>
                    </div>
                    <p className="font-body text-xs font-bold text-ink shrink-0">
                      {(item.product.price * item.qty).toLocaleString('ar-EG')} ��.م
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-hairline pt-4 space-y-2">
                <div className="flex justify-between font-body text-sm text-ink-muted">
                  <span>المجموع الفرعي</span>
                  <span>{total.toLocaleString('ar-EG')} ج.م</span>
                </div>
                <div className="flex justify-between font-body text-sm text-ink-muted">
                  <span>الشحن</span>
                  <span>{form.deliveryMethod === 'pickup' ? 'مجاناً' : 'يُحدد لاحقاً'}</span>
                </div>
                <div className="flex justify-between font-sans font-bold text-ink text-lg border-t border-hairline pt-2 mt-2">
                  <span>الإجمالي</span>
                  <span className="text-brand-primary">{total.toLocaleString('ar-EG')} ج.م</span>
                </div>
              </div>
              {submitError && (
                <div className="bg-red-100 border border-red-300 rounded-xl p-3 mb-4">
                  <p className="font-body text-sm text-red-700">{submitError}</p>
                </div>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 rounded-full bg-brand-primary hover:bg-brand-primary/90 text-white font-sans font-bold h-12 active:scale-[0.97] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'جاري إرسال الطلب...' : 'تأكيد الطلب'}
              </Button>
              <p className="font-body text-xs text-ink-muted text-center mt-3">
                سنتواصل معك خلال 24 ساعة
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
