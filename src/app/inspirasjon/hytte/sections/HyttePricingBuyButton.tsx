'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import type { ModelKey } from '@/api/constants'
import { Button } from '@/components/ui/button'

const QuickViewModal = dynamic(
  () =>
    import('@/components/products/QuickViewModal').then(
      module => module.QuickViewModal
    ),
  { ssr: false }
)

interface HyttePricingBuyButtonProps {
  productHandle: ModelKey
  labelledById: string
  className?: string
}

export function HyttePricingBuyButton({
  productHandle,
  labelledById,
  className
}: HyttePricingBuyButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button
        type='button'
        variant='commerce-primary'
        className={className}
        aria-describedby={labelledById}
        onClick={() => setIsModalOpen(true)}
      >
        Kjøp nå
      </Button>

      <QuickViewModal
        productHandle={productHandle}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        sourceSurface='hytte_pricing'
      />
    </>
  )
}
