import 'server-only'

import { getProduct } from '@/api/lib/products/getProduct'
import { requireProductPresentation } from '@/lib/products/presentation/getProductPresentation'
import { hasExactTechDownPublicSizes } from '@/lib/products/presentation/hasExactTechDownPublicSizes'
import { TECH_DOWN_PUBLIC_SIZES } from '@/lib/products/presentation/techDownSizeContract'
import { cacheLife, cacheTag } from 'next/cache'
import { buildProductCommerceViewModel } from './buildProductCommerceViewModel'

export async function getProductCommerceViewModel(
  publicHandle: string
) {
  'use cache: remote'

  const presentation = requireProductPresentation(publicHandle)

  cacheLife('products')
  cacheTag(
    'products',
    `product-${presentation.storefrontLookupHandle}`
  )

  const product = await getProduct(
    presentation.storefrontLookupHandle
  )

  return product ?
      buildProductCommerceViewModel(product, publicHandle)
    : null
}

export async function getTechDownCommerceViewModel() {
  const model = await getProductCommerceViewModel(
    'utekos-techdown'
  )

  if (!model) return null

  const receivedSizes = model.variants.map(
    variant => variant.options.size
  )

  if (!hasExactTechDownPublicSizes(receivedSizes)) {
    const receivedUniqueSizes = [
      ...new Set(
        model.variants.map(variant => variant.options.size ?? 'missing')
      )
    ]

    throw new Error(
      `TechDown commerce snapshot does not match the public size contract (expected: ${TECH_DOWN_PUBLIC_SIZES.join(', ')}; received: ${receivedUniqueSizes.join(', ')})`
    )
  }

  return model
}