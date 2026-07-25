'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import StoreLayout from '@/components/store-layout'
import type { Product } from '@/lib/types'
import ProductDetailClient from './product-detail-client'
import api from '@/lib/api'

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { id: paramId } = await params
        const [prod, all] = await Promise.all([api.get_product(paramId), api.get_products()])
        setProduct(prod)
        setAllProducts([prod, ...all.filter(p => p.id !== paramId).slice(0, 3)])
      } catch (err) {
        console.error('[v0] Failed to fetch product:', err)
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
        <div className="text-center py-20">جاري التحميل...</div>
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
