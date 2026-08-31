'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import StoreLayout from '@/components/store-layout'
import type { Product } from '@/lib/types'
import ProductDetailClient from './product-detail-client'
import api from '@/lib/api'
import { clientLogger } from '@/lib/client-logger'

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { id: paramId } = await params
        if (!paramId || paramId === 'undefined') {
          clientLogger.error('No product ID provided')
          setProduct(null)
          setLoading(false)
          return
        }
        clientLogger.log('Fetching product with ID:', paramId)
        const [prod, allRes] = await Promise.all([api.get_product(paramId), api.get_products()])
        setProduct(prod)
        const items = allRes?.items || (Array.isArray(allRes) ? allRes : [])
        setAllProducts([prod, ...items.filter(p => p.id !== paramId).slice(0, 3)])
      } catch (err) {
        clientLogger.error('Failed to fetch product:', err)
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params])

  if (loading) {
    return (
      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-square bg-surface-1 rounded-[20px] animate-pulse" />
              <div className="flex gap-2">
                <div className="w-20 h-20 bg-surface-1 rounded-xl animate-pulse" />
                <div className="w-20 h-20 bg-surface-1 rounded-xl animate-pulse" />
                <div className="w-20 h-20 bg-surface-1 rounded-xl animate-pulse" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-surface-1 rounded-xl animate-pulse w-3/4" />
              <div className="h-6 bg-surface-1 rounded-xl animate-pulse w-1/2" />
              <div className="h-4 bg-surface-1 rounded-xl animate-pulse w-full" />
              <div className="h-4 bg-surface-1 rounded-xl animate-pulse w-full" />
              <div className="h-24 bg-surface-1 rounded-xl animate-pulse" />
              <div className="h-12 bg-surface-1 rounded-xl animate-pulse w-1/3" />
            </div>
          </div>
        </div>
      </StoreLayout>
    )
  }

  if (!product) {
    notFound()
  }

  return (
    <StoreLayout>
      <ProductDetailClient product={product} allProducts={allProducts} />
    </StoreLayout>
  )
}
