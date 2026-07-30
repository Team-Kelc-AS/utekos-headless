// Path: src/lib/helpers/cart/createAddToCartFormConfig.ts
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AddToCartSchemaClient } from '@/db/zod/schemas/AddToCartSchema.client'
import type { ProductPurchaseVariant } from 'types/product/ProductPurchaseModel'

export const createAddToCartFormConfig = (
  selectedVariant: ProductPurchaseVariant | null
) => ({
  resolver: zodResolver(AddToCartSchemaClient),
  defaultValues: {
    variantId: selectedVariant?.id ?? '',
    quantity: 1
  },
  mode: 'onChange' as const
})
