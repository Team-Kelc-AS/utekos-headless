import 'server-only'

import { getAllProductsForCatalogSync } from '@/lib/shopify/admin'

import { buildOpenAiAdsProductFeed } from './buildOpenAiAdsProductFeed'
import { openAiAdsProductsSchema } from './openAiAdsProductsSchema'

export async function getOpenAiAdsProductFeed() {
  const products = await getAllProductsForCatalogSync()
  const validatedProducts =
    openAiAdsProductsSchema.parse(products)

  return buildOpenAiAdsProductFeed(validatedProducts)
}
