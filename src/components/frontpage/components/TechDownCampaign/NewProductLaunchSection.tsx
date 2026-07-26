'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { productHandle } from '@/api/constants'
import { NewProductLaunchSectionView } from './NewProductLaunchSectionView'
import type { ShopifyProduct } from 'types/product/ShopifyProduct'
import type { ShopifyProductVariant } from 'types/product/ShopifyProductVariant'

const QuickViewModal = dynamic(
  () =>
    import('@/components/products/QuickViewModal').then(
      module => module.QuickViewModal
    ),
  { ssr: false }
)

type NewProductLaunchSectionProps = {
  product: ShopifyProduct
  selectedVariant: ShopifyProductVariant | null
}

export function NewProductLaunchSection({
  product,
  selectedVariant
}: NewProductLaunchSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleQuickViewClick = () => {
    setIsModalOpen(true)
  }

  return (
    <>
      <NewProductLaunchSectionView
        onQuickViewClick={handleQuickViewClick}
        product={product}
        selectedVariant={selectedVariant}
      />

      <QuickViewModal
        productHandle={productHandle}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        sourceSurface='homepage_techdown_campaign'
      />
    </>
  )
}
