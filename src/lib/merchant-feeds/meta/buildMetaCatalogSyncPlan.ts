import type { CatalogSyncProduct } from '@/lib/catalog-sync/types'

import { buildMetaCatalogDeleteOfferIds } from './buildMetaCatalogDeleteOfferIds'
import { buildMetaCatalogItemsBatchRequests } from './buildMetaCatalogItemsBatchRequests'
import { buildMetaCatalogOffers } from './buildMetaCatalogOffers'
import {
  META_CATALOG_EXPECTED_OFFER_COUNT,
  META_CATALOG_EXPECTED_PUBLISHED_COUNT,
  META_CATALOG_EXPECTED_PUBLISHED_GROUP_COUNT,
  META_CATALOG_EXPECTED_DELETE_COUNT,
  META_CATALOG_ID,
  META_GRAPH_API_VERSION
} from './metaCatalogConstants'

export function buildMetaCatalogSyncPlan(
  products: CatalogSyncProduct[]
) {
  const offers = buildMetaCatalogOffers(products)
  const deleteOfferIds = buildMetaCatalogDeleteOfferIds(products)
  const requests = buildMetaCatalogItemsBatchRequests(
    offers,
    deleteOfferIds
  )
  const publishedOffers = offers.filter(
    offer => offer.visibility === 'published'
  )
  const publishedGroupCount = new Set(
    publishedOffers.map(offer => offer.itemGroupId)
  ).size
  const shopifyCheckoutLinkCount = offers.filter(
    offer => new URL(offer.link).hostname === 'kasse.utekos.no'
  ).length
  const missingGtinCount = offers.filter(offer => !offer.gtin).length
  const missingMpnCount = offers.filter(offer => !offer.mpn).length

  if (offers.length !== META_CATALOG_EXPECTED_OFFER_COUNT) {
    throw new Error(
      `Meta catalog plan expected ${META_CATALOG_EXPECTED_OFFER_COUNT} offers, received ${offers.length}`
    )
  }

  if (
    publishedOffers.length !== META_CATALOG_EXPECTED_PUBLISHED_COUNT ||
    deleteOfferIds.length !== META_CATALOG_EXPECTED_DELETE_COUNT
  ) {
    throw new Error(
      `Meta catalog plan expected ${META_CATALOG_EXPECTED_PUBLISHED_COUNT} published offers and ${META_CATALOG_EXPECTED_DELETE_COUNT} deleted offer IDs, received ${publishedOffers.length} and ${deleteOfferIds.length}`
    )
  }

  if (
    publishedGroupCount !==
    META_CATALOG_EXPECTED_PUBLISHED_GROUP_COUNT
  ) {
    throw new Error(
      `Meta catalog plan expected ${META_CATALOG_EXPECTED_PUBLISHED_GROUP_COUNT} published product groups, received ${publishedGroupCount}`
    )
  }

  if (
    missingGtinCount > 0 ||
    missingMpnCount > 0 ||
    shopifyCheckoutLinkCount > 0
  ) {
    throw new Error(
      `Meta catalog plan failed identity/link coverage: gtin=${missingGtinCount}, mpn=${missingMpnCount}, checkout_links=${shopifyCheckoutLinkCount}`
    )
  }

  return {
    catalogId: META_CATALOG_ID,
    graphApiVersion: META_GRAPH_API_VERSION,
    offerCount: offers.length,
    publishedCount: publishedOffers.length,
    deleteCount: deleteOfferIds.length,
    requestCount: requests.length,
    publishedGroupCount,
    missingGtinCount,
    missingMpnCount,
    shopifyCheckoutLinkCount,
    imageCount: offers.reduce(
      (count, offer) => count + offer.images.length,
      0
    ),
    videoCount: offers.reduce(
      (count, offer) => count + offer.videos.length,
      0
    ),
    offers,
    deleteOfferIds,
    requests
  }
}
