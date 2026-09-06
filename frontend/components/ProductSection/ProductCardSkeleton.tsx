import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const CARD_CLIP =
  'polygon(0 18px, 18px 0, 100% 0, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0 100%)'

export default function ProductCardSkeleton() {
  return (
    <div className="relative flex h-full flex-col">
      <div
        className="flex h-full flex-col overflow-hidden bg-canvas ring-1 ring-hairline"
        style={{ clipPath: CARD_CLIP }}
      >
        <Skeleton className="w-full aspect-[4/3] rounded-none" />
        <div className="flex flex-1 flex-col gap-3 p-4 pb-5 sm:p-5">
          <Skeleton className="h-4 w-4/5 rounded-lg" />
          <Skeleton className="h-4 w-3/5 rounded-lg" />
          <div className="flex flex-wrap gap-1.5" dir="ltr">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <Skeleton className="h-8 w-20 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-full sm:h-10 sm:w-10" />
          </div>
        </div>
      </div>
    </div>
  )
}
