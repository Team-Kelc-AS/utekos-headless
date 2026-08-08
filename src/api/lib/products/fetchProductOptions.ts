import 'server-only'
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
import type { ShopifyOperation } from '@types'

type ProductOptionsOperation = ShopifyOperation<
  { product: StorefrontProductOptions | null },
  StorefrontProductOptionsVariables
>

export async function fetchProductOptions(
  variables: StorefrontProductOptionsVariables
) {
  const parsedVariables =
    parseStorefrontProductOptionsVariables(variables)
  const response = await storefrontGateway.catalogQuery<ProductOptionsOperation>({
    cache: 'no-store',
    query: getProductOptionsQuery,
    variables: parsedVariables
  })

  if (!response.success) {
    throw new Error(
      response.error.errors[0]?.message ??
        `Failed to fetch product options: ${parsedVariables.handle}`
    )
  }

  if (!response.body.product) return null

  const product = parseStorefrontProductOptions(
    response.body.product
  )

  return createUtekosProductOptions(product)
}
