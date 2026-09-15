'use client'

import { useMicrofiberLogic } from '@/hooks/useMicrofiberLogic'
import { MicrofiberView } from './MicrofiberView'
import type { ShopifyProduct } from 'types/product'

export function PurchaseSectionClient({
  product
}: {
  product: ShopifyProduct | null
}) {
  const logic = useMicrofiberLogic(product)

  return <MicrofiberView {...logic} />
}
