'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart-context'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, total } = useCart()

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && closeCart()}>
      <SheetContent side="right" className="w-full sm:w-[420px] flex flex-col p-0 bg-canvas border-s border-hairline">
        <SheetHeader className="px-5 py-4 border-b border-hairline">
          <SheetTitle className="font-sans font-bold text-ink text-lg text-start">
            سلة التسوق
            {items.length > 0 && (
              <span className="ms-2 text-sm font-body font-normal text-ink-muted">
                ({items.length} منتج)
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5">
            <div className="w-16 h-16 rounded-full bg-surface-1 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-ink-muted" />
            </div>
            <p className="font-body text-ink-muted text-center">سلتك فارغة</p>
            <Button
              onClick={closeCart}
              className="rounded-full bg-brand-primary text-white hover:bg-brand-primary/90"
            >
              تصفح المنتجات
            </Button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.map(item => (
                <div key={item.product.id} className="flex gap-3 bg-surface-1 rounded-[20px] p-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-canvas">
                    <Image
                      src={item.product.photos[0]}
                      alt={item.product.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <p className="font-sans font-bold text-sm text-ink line-clamp-2 leading-snug">
                      {item.product.name}
                    </p>
                    <p className="font-sans font-bold text-brand-primary text-sm">
                      {(item.product.price * item.qty).toLocaleString('ar-EG')} ج.م
                    </p>
                    <div className="flex items-center gap-2 mt-auto">
                      <button
                        onClick={() => updateQty(item.product.id, item.qty - 1)}
                        className="w-7 h-7 rounded-full bg-canvas border border-hairline flex items-center justify-center hover:bg-surface-2 transition-colors"
                        aria-label="تقليل"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-body font-semibold text-sm w-6 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.product.id, item.qty + 1)}
                        className="w-7 h-7 rounded-full bg-canvas border border-hairline flex items-center justify-center hover:bg-surface-2 transition-colors"
                        aria-label="زيادة"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="ms-auto w-7 h-7 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                        aria-label="حذف"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-hairline space-y-3 bg-canvas">
              <div className="flex items-center justify-between">
                <span className="font-body text-ink-muted">الإجمالي</span>
                <span className="font-sans font-bold text-xl text-ink">
                  {total.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
              <Link href="/checkout" onClick={closeCart}>
                <Button className="w-full rounded-full bg-brand-primary hover:bg-brand-primary/90 text-white font-sans font-bold py-3 h-12">
                  إتمام الطلب
                </Button>
              </Link>
              <button
                onClick={closeCart}
                className="w-full text-center font-body text-sm text-ink-muted hover:text-brand-primary transition-colors"
              >
                متابعة التسوق
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
