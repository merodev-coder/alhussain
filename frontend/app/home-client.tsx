'use client'

import React, { useEffect, useMemo, useState } from 'react'
import StoreLayout from '@/components/store-layout'
import HeroSection from '@/components/Hero/HeroSection'
import CategoryRow from '@/components/CategoryRow/CategoryRow'
import ProductSection from '@/components/ProductSection/ProductSection'
import FeatureTicker from '@/components/home/feature-ticker'
import InstallmentBanner, { PerksStrip } from '@/components/home/installment-banner'
import TrustSection from '@/components/home/trust-section'
import { api } from '@/lib/api'
import type { HeroSlide, Product } from '@/lib/types'

// The 8 dashboard categories, in the exact homepage display order requested.
const HOME_SECTIONS = [
  'chargers',
  'laptops',
  'bags',
  'mice',
  'storage',
  'ram',
  'monitors',
  'batteries',
] as const

type HomeSectionKey = (typeof HOME_SECTIONS)[number]

const SECTION_LABELS: Record<HomeSectionKey, string> = {
  laptops: 'لابتوبات',
  bags: 'شنط',
  mice: 'ماوسات',
  ram: 'رامات',
  storage: 'هاردات',
  batteries: 'بطاريات',
  chargers: 'شواحن',
  monitors: 'شاشات',
}

// Admins tag a product as a best-seller by typing this phrase into the
// free-text "badge" field. Arabic has several interchangeable letter forms
// (أ/إ/آ vs ا, ة vs ه, ى vs ي) admins commonly mix up, so both sides of the
// comparison are normalized rather than doing a strict substring match.
const BEST_SELLER_TAG = 'الأكثر مبيعاً'
const normalizeArabic = (s: string) =>
  s
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
const NORMALIZED_BEST_SELLER_TAG = normalizeArabic(BEST_SELLER_TAG)

// Show at most this many items in the curated rows (best sellers, new arrivals, offers).
const MAX_CURATED = 12

export default function HomeClient() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [dbProducts, setDbProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    api.get_hero_slides().then(setSlides).catch(() => {})

    // The backend caps `limit` at 100 per page, so a single call can silently
    // truncate the catalog once the store has more than 100 products. Walk
    // every page and merge, so best-sellers/new-arrivals/category sections
    // are always computed against the full product list.
    async function fetchAllProducts() {
      const PAGE_SIZE = 100
      try {
        const first = await api.get_products('', 1, PAGE_SIZE)
        const firstItems = Array.isArray(first) ? first : first.items || []
        const totalPages = Array.isArray(first) ? 1 : first.pages || 1

        let all = firstItems
        if (totalPages > 1) {
          const rest = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) => api.get_products('', i + 2, PAGE_SIZE))
          )
          for (const r of rest) {
            all = all.concat(Array.isArray(r) ? r : r.items || [])
          }
        }
        if (!cancelled) setDbProducts(all)
      } catch {
        // keep whatever we have; sections that end up empty simply hide themselves
      } finally {
        if (!cancelled) setProductsLoading(false)
      }
    }

    fetchAllProducts()
    return () => {
      cancelled = true
    }
  }, [])

  const visibleProducts = useMemo(
    () => dbProducts.filter(p => p.visible !== false),
    [dbProducts]
  )

  const sectionProducts = useMemo(() => {
    return HOME_SECTIONS.reduce<Record<HomeSectionKey, Product[]>>(
      (sections, section) => {
        sections[section] = visibleProducts.filter(product => product.homeSection === section)
        return sections
      },
      { laptops: [], bags: [], mice: [], ram: [], storage: [], batteries: [], chargers: [], monitors: [] }
    )
  }, [visibleProducts])

  // Best sellers: admin-tagged via the free-text "badge" field on the product.
  // This row is intentionally curated by the admin, so it's shown as-is even
  // if a product also happens to be new or discounted.
  const bestSellers = useMemo(
    () =>
      visibleProducts
        .filter(p => normalizeArabic(p.badge || '').includes(NORMALIZED_BEST_SELLER_TAG))
        .slice(0, MAX_CURATED),
    [visibleProducts]
  )
  const bestSellerIds = useMemo(() => new Set(bestSellers.map(p => p.id)), [bestSellers])

  // New arrivals: most recently added products, newest first. Skips anything
  // already shown in "best sellers" just above it so the same card doesn't
  // repeat twice in a row.
  const newArrivals = useMemo(() => {
    return [...visibleProducts]
      .filter(p => !bestSellerIds.has(p.id))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, MAX_CURATED)
  }, [visibleProducts, bestSellerIds])
  const newArrivalIds = useMemo(() => new Set(newArrivals.map(p => p.id)), [newArrivals])

  // Special offers: any product the admin has given a discount badge to,
  // excluding anything already surfaced above it on the page.
  const specialOffers = useMemo(
    () =>
      visibleProducts
        .filter(p => !!p.discountBadge && !bestSellerIds.has(p.id) && !newArrivalIds.has(p.id))
        .slice(0, MAX_CURATED),
    [visibleProducts, bestSellerIds, newArrivalIds]
  )

  return (
    <StoreLayout showTopBar>
      <HeroSection slides={slides} />
      <CategoryRow />

      <ProductSection
        id="section-best-sellers"
        title="الأكثر مبيعاً"
        sectionKey="best-sellers"
        categorySlug="laptops"
        products={bestSellers}
        loading={productsLoading}
      />

      <ProductSection
        id="section-new-arrivals"
        title="وصل حديثاً"
        sectionKey="new-arrivals"
        categorySlug="laptops"
        products={newArrivals}
        loading={productsLoading}
      />

      <ProductSection
        id="section-special-offers"
        title="عروض مميزة"
        sectionKey="special-offers"
        categorySlug="laptops"
        products={specialOffers}
        loading={productsLoading}
      />

      <FeatureTicker />

      <ProductSection
        id="section-chargers"
        title={SECTION_LABELS.chargers}
        sectionKey="chargers"
        categorySlug="chargers"
        products={sectionProducts.chargers}
        loading={productsLoading}
      />

      <InstallmentBanner />

      <ProductSection
        id="section-laptops"
        title={SECTION_LABELS.laptops}
        sectionKey="laptops"
        categorySlug="laptops"
        products={sectionProducts.laptops}
        loading={productsLoading}
      />

      <ProductSection
        id="section-bags"
        title={SECTION_LABELS.bags}
        sectionKey="bags"
        categorySlug="bags"
        products={sectionProducts.bags}
        loading={productsLoading}
      />

      <ProductSection
        id="section-mice"
        title={SECTION_LABELS.mice}
        sectionKey="mice"
        categorySlug="mice"
        products={sectionProducts.mice}
        loading={productsLoading}
      />

      <ProductSection
        id="section-storage"
        title={SECTION_LABELS.storage}
        sectionKey="storage"
        categorySlug="storage"
        products={sectionProducts.storage}
        loading={productsLoading}
      />

      <ProductSection
        id="section-ram"
        title={SECTION_LABELS.ram}
        sectionKey="ram"
        categorySlug="ram"
        products={sectionProducts.ram}
        loading={productsLoading}
      />

      <ProductSection
        id="section-monitors"
        title={SECTION_LABELS.monitors}
        sectionKey="monitors"
        categorySlug="monitors"
        products={sectionProducts.monitors}
        loading={productsLoading}
      />

      <ProductSection
        id="section-batteries"
        title={SECTION_LABELS.batteries}
        sectionKey="batteries"
        categorySlug="batteries"
        products={sectionProducts.batteries}
        loading={productsLoading}
      />

      <PerksStrip />

      <TrustSection />
    </StoreLayout>
  )
}
