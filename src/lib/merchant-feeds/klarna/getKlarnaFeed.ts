import 'server-only'

import { TAGS } from '@/api/constants/cacheTags'
import { getAllProductsForCatalogSync } from '@/lib/shopify/admin'
import { cacheLife, cacheTag } from 'next/cache'

import { catalogSyncProductsSchema } from '../catalogSyncProductsSchema'
import {
  buildKlarnaFeedDocument,
  type KlarnaFeedDocument
} from './buildKlarnaFeed'

async function loadCachedKlarnaFeed() {
  'use cache: remote'

  cacheTag(TAGS.products)
  cacheLife('max')

  const products = await getAllProductsForCatalogSync()
  const validatedProducts =
    catalogSyncProductsSchema.parse(products)

  return buildKlarnaFeedDocument(validatedProducts)
}

export function createKlarnaFeedLoader(
  loadFeed: () => Promise<KlarnaFeedDocument>
) {
  let inFlight: Promise<KlarnaFeedDocument> | null = null

  return function getKlarnaFeed() {
    if (inFlight) {
      return inFlight
    }

    const request = loadFeed()
    inFlight = request

    void request.then(
      () => {
        if (inFlight === request) {
          inFlight = null
        }
      },
      () => {
        if (inFlight === request) {
          inFlight = null
        }
      }
    )

    return request
  }
}

export const getKlarnaFeed = createKlarnaFeedLoader(
  loadCachedKlarnaFeed
)
