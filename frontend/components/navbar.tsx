'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart,
  Menu,
  X,
  Search,
  LayoutList,
  Loader2,
  Cpu,
  Laptop,
} from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { ThemeToggle } from '@/components/theme-toggle'
import { api } from '@/lib/api'
import type { Product } from '@/lib/types'

export default function Navbar() {
  const router = useRouter()
  const { count, openCart } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // 300ms Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch search results on debounced query change
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    let active = true
    setIsSearching(true)

    api
      .get_products(debouncedQuery, 1, 6)
      .then(res => {
        if (!active) return
        const items = Array.isArray(res) ? res : res.items || []
        setSearchResults(items)
      })
      .catch(() => {
        if (active) setSearchResults([])
      })
      .finally(() => {
        if (active) setIsSearching(false)
      })

    return () => {
      active = false
    }
  }, [debouncedQuery])

  // Close dropdown on click outside or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setShowDropdown(false)
    router.push(`/laptops?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  const handleSelectProduct = (productId: string) => {
    setShowDropdown(false)
    setSearchQuery('')
    router.push(`/laptops/${productId}`)
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-canvas text-ink border-b border-hairline shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          {/* Logo on the left (in LTR terms) or start */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 hover:opacity-95 transition-opacity"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 relative rounded-xl overflow-hidden border border-hairline bg-surface-1 shadow-sm flex items-center justify-center">
              <Image
                src="/logo.jpeg"
                alt="الحسين للاب توب"
                width={44}
                height={44}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-extrabold text-base sm:text-lg text-ink leading-tight">
                الحسين للاب توب
              </span>
              <span className="text-[11px] text-ink-muted font-medium hidden sm:inline">
                أجهزة استيراد فرز أول
              </span>
            </div>
          </Link>

          {/* Centered Search Bar */}
          <div
            ref={searchContainerRef}
            className="flex-1 max-w-xl relative hidden sm:block"
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="ابحث عن الموديل، المعالج (Core i7)، كارت الشاشة أو السعر..."
                  className="w-full h-10 pr-10 pl-10 rounded-full bg-surface-1 text-ink placeholder-ink-muted border border-transparent focus:border-brand-primary focus:bg-canvas text-sm font-sans outline-none transition-all shadow-inner"
                />
                <Search className="w-4 h-4 text-ink-muted absolute right-3.5 pointer-events-none" />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setSearchResults([])
                    }}
                    className="absolute left-3 p-1 text-ink-muted hover:text-ink rounded-full"
                    aria-label="مسح البحث"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : isSearching ? (
                  <Loader2 className="w-4 h-4 text-brand-primary animate-spin absolute left-3.5 pointer-events-none" />
                ) : null}
              </div>
            </form>

            {/* Instant Search Dropdown Preview */}
            {showDropdown && searchQuery.trim().length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-canvas border border-hairline rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                {isSearching ? (
                  <div className="p-6 text-center text-sm text-ink-muted flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                    <span>جاري البحث في الأجهزة والمواصفات...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="divide-y divide-hairline max-h-[380px] overflow-y-auto">
                    {searchResults.map(product => {
                      const imageSrc =
                        product.photos && product.photos.length > 0
                          ? product.photos[0]
                          : '/logo.jpeg'
                      return (
                        <button
                          key={product.id}
                          onClick={() => handleSelectProduct(product.id)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-surface-1 transition-colors text-right cursor-pointer"
                        >
                          <div className="w-12 h-12 relative rounded-lg bg-surface-1 overflow-hidden shrink-0 border border-hairline">
                            <Image
                              src={imageSrc}
                              alt={product.name}
                              fill
                              sizes="48px"
                              className="object-contain p-1"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-sans font-bold text-sm text-ink truncate">
                              {product.name}
                            </h4>
                            <p className="text-xs text-ink-muted truncate mt-0.5">
                              <span dir="ltr">
                                {[
                                  product.cpu,
                                  product.ram,
                                  product.storage,
                                  product.gpu,
                                ]
                                  .filter(Boolean)
                                  .join(' • ')}
                              </span>
                            </p>
                          </div>
                          <div className="text-left shrink-0">
                            <span className="font-bold text-sm text-brand-primary">
                              {product.price.toLocaleString('ar-EG')} ج.م
                            </span>
                          </div>
                        </button>
                      )
                    })}
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full py-2.5 px-4 bg-surface-1 hover:bg-surface-2 text-center text-xs font-bold text-brand-primary transition-colors block"
                    >
                      عرض جميع النتائج لـ &ldquo;{searchQuery}&rdquo; ←
                    </button>
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-ink-muted">
                    لا توجد منتجات مطابقة لـ &ldquo;{searchQuery}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Section: Theme Toggle, Cart, and Price List Icon */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Dark/Light mode toggle to the LEFT of the cart icon */}
            <ThemeToggle className="hover:bg-surface-1" />

            {/* Cart Icon */}
            <button
              onClick={openCart}
              className="relative p-2 rounded-full hover:bg-surface-1 transition-colors text-ink"
              aria-label="سلة المشتريات"
              title="سلة المشتريات"
            >
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              {count > 0 && (
                <span className="absolute -top-1 -start-1 w-5 h-5 bg-brand-accent text-white text-xs rounded-full flex items-center justify-center font-sans font-bold shadow">
                  {count}
                </span>
              )}
            </button>

            {/* Price List icon button to the RIGHT of the cart icon */}
            <Link
              href="/price-list"
              className="p-2 rounded-full hover:bg-surface-1 transition-colors text-ink flex items-center justify-center"
              aria-label="قائمة الأسعار"
              title="قائمة الأسعار"
            >
              <LayoutList className="w-5 h-5 sm:w-6 sm:h-6 text-ink hover:text-brand-primary transition-colors" />
            </Link>

            {/* Mobile Hamburger Drawer Toggle */}
            <button
              className="sm:hidden p-2 rounded-full hover:bg-surface-1 transition-colors text-ink"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="القائمة"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (Always visible on mobile in top bar area) */}
        <div className="sm:hidden pb-3 pt-1">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث عن الموديل، المعالج، كارت الشاشة..."
              className="w-full h-9 pr-9 pl-8 rounded-full bg-surface-1 text-ink placeholder-ink-muted border border-transparent focus:border-brand-primary text-xs font-sans outline-none"
            />
            <Search className="w-3.5 h-3.5 text-ink-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-muted"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-hairline bg-canvas px-4 pb-6 pt-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col gap-1 text-sm font-semibold">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 rounded-xl hover:bg-surface-1 text-ink transition-colors"
            >
              الرئيسية
            </Link>
            <Link
              href="/laptops"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 rounded-xl hover:bg-surface-1 text-ink transition-colors"
            >
              جميع اللابتوبات
            </Link>
            <Link
              href="/price-list"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 rounded-xl hover:bg-surface-1 text-brand-primary flex items-center justify-between transition-colors"
            >
              <span>قائمة الأسعار (جدول شامل)</span>
              <LayoutList className="w-4 h-4" />
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 rounded-xl hover:bg-surface-1 text-ink transition-colors"
            >
              عن المتجر والضمان
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
