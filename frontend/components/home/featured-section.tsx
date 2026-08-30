'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ProductCard from '@/components/product-card'
import type { Product } from '@/lib/types'
import api from '@/lib/api'
import { clientLogger } from '@/lib/client-logger'

export default function FeaturedSection() {
  const [featured, setFeatured] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getFeatured = async () => {
      try {
        const products = await api.get_products()
        setFeatured(products.filter(p => p.visible).slice(0, 6))
      } catch (err) {
        clientLogger.error('Failed to fetch featured products:', err)
        setFeatured([])
      } finally {
        setLoading(false)
      }
    }
    getFeatured()
  }, [])

  if (loading || featured.length === 0) return null

  return (
    <section className="bg-surface-1 py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="font-body text-sm text-brand-primary font-medium mb-1">أحدث الوافدات</p>
            <h2 className="font-sans font-bold text-ink text-3xl text-balance">اللابتوبات المميزة</h2>
          </div>
          <Link
            href="/laptops"
            className="hidden sm:flex items-center gap-1 font-sans font-semibold text-sm text-brand-primary hover:underline"
          >
            عرض الكل
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {featured.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="flex justify-center mt-8 sm:hidden">
          <Link
            href="/laptops"
            className="flex items-center gap-1 font-sans font-semibold text-sm text-brand-primary hover:underline"
          >
            عرض جميع اللابتوبات
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
