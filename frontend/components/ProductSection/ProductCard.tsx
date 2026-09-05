'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/types'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageSrc =
    product.photos && product.photos.length > 0 ? product.photos[0] : '/logo.jpeg'

  // Build formatted specs line
  const specsList = [
    product.specs?.cpu || product.cpu,
    product.specs?.ram || product.ram,
    product.specs?.storage || product.storage,
    product.specs?.gpu || product.gpu,
  ].filter(Boolean)

  const specsText = specsList.join(' • ') || 'مواصفات مميزة'

  return (
    <Link
      href={`/laptops/${product.id}`}
      className="group shrink-0 w-[160px] sm:w-[220px] rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 shadow-sm hover:shadow-md hover:scale-[1.03] transition-all duration-200 flex flex-col overflow-hidden relative select-none"
    >
      {/* Optional Badge Top-Right */}
      {(product.badge || product.discountBadge) && (
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="bg-slate-800 dark:bg-slate-900 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
            {product.badge || product.discountBadge}
          </span>
        </div>
      )}

      {/* Product Image (160px height, object-fit: contain) */}
      <div className="w-full h-[140px] sm:h-[160px] relative p-3 bg-gray-50/50 dark:bg-gray-900/40 flex items-center justify-center overflow-hidden">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 160px, 220px"
          loading="lazy"
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Details Area */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-1 text-right">
        <div>
          {/* Product Name (Bold, 14px, max 2 lines) */}
          <h3 className="font-sans font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {product.name}
          </h3>

          {/* Short Specs Line (Gray, 12px, LTR) */}
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
            <span dir="ltr">{specsText}</span>
          </p>
        </div>

        {/* Price in EGP (Bold Deep Blue #1d4ed8, 16px) */}
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-baseline justify-between">
          <span className="font-sans font-extrabold text-sm sm:text-base text-[#1d4ed8] dark:text-blue-400">
            {product.price.toLocaleString('ar-EG')} ج.م
          </span>
        </div>
      </div>
    </Link>
  )
}
