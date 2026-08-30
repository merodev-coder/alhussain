'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { ThemeToggle } from '@/components/theme-toggle'

const NAV_LINKS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/laptops', label: 'اللابتوبات' },
  { href: '/accessories', label: 'الإكسسوارات' },
  { href: '/pricelist', label: 'قائمة الأسعار' },
  { href: '/about', label: 'من نحن' },
]

export default function Navbar() {
  const { count, openCart } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-canvas/80 backdrop-blur-md border-b border-hairline">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo.jpeg"
              alt="الحسين للاب توب"
              width={48}
              height={48}
              className="rounded-xl object-cover"
            />
            <span className="font-sans font-bold text-lg text-ink hidden sm:block">
              الحسين للاب توب
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-full text-sm font-sans font-semibold text-ink-muted hover:text-brand-primary hover:bg-surface-1 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Cart + ThemeToggle + Mobile toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={openCart}
              className="relative p-2 rounded-full hover:bg-surface-1 transition-colors"
              aria-label="السلة"
            >
              <ShoppingCart className="w-6 h-6 text-ink" />
              {count > 0 && (
                <span className="absolute -top-1 -start-1 w-5 h-5 bg-brand-primary text-white text-xs rounded-full flex items-center justify-center font-sans font-bold">
                  {count}
                </span>
              )}
            </button>
            <button
              className="md:hidden p-2 rounded-full hover:bg-surface-1 transition-colors"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="القائمة"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-hairline bg-canvas px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl font-sans font-semibold text-ink-muted hover:text-brand-primary hover:bg-surface-1 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
