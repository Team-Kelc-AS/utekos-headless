'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import type { ModelKey } from '@/api/constants'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/className'

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
  buttonClassName?: string
  variant?: 'commerce-primary' | 'default' | 'checkout'
}

export function HyttePricingBuyButton({
  productHandle,
  labelledById,
  className,
  buttonClassName,
  variant = 'commerce-primary'
}: HyttePricingBuyButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button
        type='button'
        variant={variant}
        className={cn(
          'font-utekos-text-medium',
          className,
          buttonClassName
        )}
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
