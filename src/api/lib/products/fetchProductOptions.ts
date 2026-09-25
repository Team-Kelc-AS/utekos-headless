import 'server-only'
import { TAGS } from '@/api/constants/cacheTags'
import { getProductOptionsQuery } from '@/api/graphql/queries/products'
import { storefrontGateway } from '@/api/shopify/storefront/storefrontGateway.server'
import type {
  StorefrontProductOptions,
  StorefrontProductOptionsVariables
} from '@/api/shopify/types/storefrontProductOptions'
import { createUtekosProductOptions } from '@/lib/shopify/product-options/createUtekosProductOptions'
import {
  parseStorefrontProductOptions,
  parseStorefrontProductOptionsVariables
} from './parseStorefrontProductOptions'
import { cacheLife, cacheTag } from 'next/cache'
import type { ShopifyOperation } from '@types'

type ProductOptionsOperation = ShopifyOperation<
  { product: StorefrontProductOptions | null },
  StorefrontProductOptionsVariables
>

export async function fetchProductOptions(
  variables: StorefrontProductOptionsVariables
) {
  const product = await fetchStorefrontProductOptions(variables)

  return product ? createUtekosProductOptions(product) : null
}

export async function fetchStorefrontProductOptions(
  variables: StorefrontProductOptionsVariables
) {
  'use cache: remote'

  const parsedVariables =
    parseStorefrontProductOptionsVariables(variables)
  cacheTag(`product-${parsedVariables.handle}`, TAGS.products)
  cacheLife('max')

  const response =
    await storefrontGateway.catalogQuery<ProductOptionsOperation>(
      {
        cache: 'no-store',
        query: getProductOptionsQuery,
        variables: parsedVariables
      }
    )

  if (!response.success) {
    throw new Error(
      response.error.errors[0]?.message ??
        `Failed to fetch product options: ${parsedVariables.handle}`
    )
  }

  if (!response.body.product) return null

  return parseStorefrontProductOptions(response.body.product)
}
