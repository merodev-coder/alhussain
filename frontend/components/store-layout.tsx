'use client'

import Navbar from './navbar'
import Footer from './footer'
import WhatsAppFAB from './whatsapp-fab'
import CartDrawer from './cart-drawer'
import TopAnnouncementBar from './home/top-announcement-bar'
import { CartProvider } from '@/lib/cart-context'

interface StoreLayoutProps {
  children: React.ReactNode
  /** Shows the promo/installment-brands strip above the navbar. Homepage only. */
  showTopBar?: boolean
}

export default function StoreLayout({ children, showTopBar = false }: StoreLayoutProps) {
  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen">
        <div className="sticky top-0 z-50">
          {showTopBar && <TopAnnouncementBar />}
          <Navbar />
        </div>
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
