'use client'

import React, { useEffect, useMemo, useState } from 'react'
import StoreLayout from '@/components/store-layout'
import HeroSection from '@/components/Hero/HeroSection'
import CategoryRow from '@/components/CategoryRow/CategoryRow'
import ProductSection from '@/components/ProductSection/ProductSection'
import TrustSection from '@/components/home/trust-section'
import { api } from '@/lib/api'
import type { HeroSlide, Product } from '@/lib/types'

const HOME_SECTIONS = ['graphics', 'business', 'accessories', 'batteries', 'storage'] as const

type HomeSectionKey = (typeof HOME_SECTIONS)[number]

const SECTION_LABELS: Record<HomeSectionKey, string> = {
  graphics: 'لابتوبات جرافيك',
  business: 'لابتوبات بزنس',
  accessories: 'إكسسوارات',
  batteries: 'بطاريات وشاشات',
  storage: 'تخزين ورام',
}

export default function HomeClient() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [dbProducts, setDbProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)

  useEffect(() => {
    api.get_hero_slides().then(setSlides).catch(() => {})
    api
      .get_products('', 1, 100)
      .then(response => setDbProducts(Array.isArray(response) ? response : response.items || []))
      .catch(() => {})
      .finally(() => setProductsLoading(false))
  }, [])

  const sectionProducts = useMemo(() => {
    return HOME_SECTIONS.reduce<Record<HomeSectionKey, Product[]>>(
      (sections, section) => {
        sections[section] = dbProducts.filter(product => product.homeSection === section)
        return sections
      },
      { graphics: [], business: [], accessories: [], batteries: [], storage: [] },
    )
  }, [dbProducts])

  return (
    <StoreLayout>
      <HeroSection slides={slides} />
      <CategoryRow />

      {HOME_SECTIONS.map(section => (
        <ProductSection
          key={section}
          id={`section-${section}`}
          title={SECTION_LABELS[section]}
          sectionKey={section}
          categorySlug={section}
          products={sectionProducts[section]}
          loading={productsLoading}
        />
      ))}

      <TrustSection />
    </StoreLayout>
  )
}
