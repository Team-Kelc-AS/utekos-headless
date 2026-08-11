import 'server-only'

import { getProduct } from '@/api/lib/products/getProduct'
import { requireProductPresentation } from '@/lib/products/presentation'
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

  const sizes = model.variants.map(variant => variant.options.size)
  const expectedSizes = ['Middels', 'Stor', 'Ekstra stor']

  if (
    sizes.length !== expectedSizes.length ||
    expectedSizes.some(size => !sizes.includes(size))
  ) {
    throw new Error(
      'TechDown commerce snapshot does not match the public size contract'
    )
  }

  return model
}
