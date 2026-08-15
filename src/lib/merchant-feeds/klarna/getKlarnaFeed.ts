import 'server-only'

import { getAllProductsForCatalogSync } from '@/lib/shopify/admin'

import { catalogSyncProductsSchema } from '../catalogSyncProductsSchema'
import { buildKlarnaFeedDocument } from './buildKlarnaFeed'

export async function getKlarnaFeed() {
  const products = await getAllProductsForCatalogSync()
  const validatedProducts =
    catalogSyncProductsSchema.parse(products)

  return buildKlarnaFeedDocument(validatedProducts)
}
