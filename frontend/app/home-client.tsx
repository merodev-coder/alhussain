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

// The 8 dashboard accessory-style categories, in the exact homepage display
// order requested. "laptops" is handled separately below since every
// Product in this store is a laptop by model design (cpu/gpu/ram/storage
// fields), so that row always shows the full catalog rather than only
// products explicitly tagged homeSection: 'laptops'.
const ACCESSORY_SECTIONS = ['bags', 'mice', 'storage', 'ram', 'monitors', 'batteries', 'chargers'] as const

type AccessorySectionKey = (typeof ACCESSORY_SECTIONS)[number]

const SECTION_LABELS: Record<AccessorySectionKey | 'laptops', string> = {
  laptops: 'لابتوبات',
  bags: 'شنط',
  mice: 'ماوسات',
  ram: 'رامات',
  storage: 'هاردات',
  batteries: 'بطاريات',
  chargers: 'شواحن',
  monitors: 'شاشات',
}

// Show at most this many items in the curated rows (best sellers, offers, laptops).
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
    // every page and merge, so best-sellers/offers/category sections are
    // always computed against the full product list.
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

  // The 7 accessory-style rows: only products explicitly assigned to that
  // homeSection by the admin (a mouse shouldn't show up under "شواحن", etc).
  const sectionProducts = useMemo(() => {
    return ACCESSORY_SECTIONS.reduce<Record<AccessorySectionKey, Product[]>>(
      (sections, section) => {
        sections[section] = visibleProducts.filter(product => product.homeSection === section)
        return sections
      },
      { bags: [], mice: [], storage: [], ram: [], monitors: [], batteries: [], chargers: [] }
    )
  }, [visibleProducts])

  // Best sellers: admin explicitly assigns homeSection: 'best_sellers' from the dashboard.
  const bestSellers = useMemo(
    () => visibleProducts.filter(p => p.homeSection === 'best_sellers').slice(0, MAX_CURATED),
    [visibleProducts]
  )

  // Latest offers: admin explicitly assigns homeSection: 'special_offers' from the dashboard.
  const specialOffers = useMemo(
    () => visibleProducts.filter(p => p.homeSection === 'special_offers').slice(0, MAX_CURATED),
    [visibleProducts]
  )

  // Laptops: every Product in this store is a laptop by model design, so
  // this row shows the whole catalog (newest first) rather than only
  // products explicitly tagged homeSection: 'laptops'.
  const allLaptops = useMemo(() => {
    return [...visibleProducts]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, MAX_CURATED)
  }, [visibleProducts])

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
        id="section-special-offers"
        title="أحدث العروض"
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
        products={allLaptops}
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
