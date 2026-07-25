'use client'

import Navbar from './navbar'
import Footer from './footer'
import WhatsAppFAB from './whatsapp-fab'
import CartDrawer from './cart-drawer'
import { CartProvider } from '@/lib/cart-context'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <WhatsAppFAB />
        <CartDrawer />
      </div>
    </CartProvider>
  )
}
