import 'server-only'

import { getAllProductsForCatalogSync } from '@/lib/shopify/admin'

import { buildPinterestCatalogFeedDocument } from './buildPinterestCatalogFeed'
import { pinterestCatalogProductsSchema } from './pinterestCatalogProductsSchema'

export async function getPinterestCatalogFeed() {
  const products = await getAllProductsForCatalogSync()
  const validatedProducts =
    pinterestCatalogProductsSchema.parse(products)

  return buildPinterestCatalogFeedDocument(validatedProducts)
}
