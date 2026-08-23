import 'server-only'

import { getAllProductsForCatalogSync } from '@/lib/shopify/admin'

import { buildSnapchatCatalogFeedDocument } from './buildSnapchatCatalogFeed'
import { snapchatCatalogProductsSchema } from './snapchatCatalogProductsSchema'

export async function getSnapchatCatalogFeed() {
  const products = await getAllProductsForCatalogSync()
  const validatedProducts =
    snapchatCatalogProductsSchema.parse(products)

  return buildSnapchatCatalogFeedDocument(validatedProducts)
}
