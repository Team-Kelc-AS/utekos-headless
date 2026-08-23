import 'server-only'

import { getAllProductsForCatalogSync } from '@/lib/shopify/admin'

import { buildMetaCatalogFeedDocument } from './buildMetaCatalogFeed'
import { metaCatalogProductsSchema } from './metaCatalogProductsSchema'

export async function getMetaCatalogFeed() {
  const products = await getAllProductsForCatalogSync()
  const validatedProducts = metaCatalogProductsSchema.parse(products)

  return buildMetaCatalogFeedDocument(validatedProducts)
}
