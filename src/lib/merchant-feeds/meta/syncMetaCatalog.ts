import 'server-only'

import { getAllProductsForCatalogSync } from '@/lib/shopify/admin'

import { buildMetaCatalogSyncPlan } from './buildMetaCatalogSyncPlan'
import { postMetaCatalogItemsBatch } from './postMetaCatalogItemsBatch'
import { waitForMetaCatalogBatchStatus } from './waitForMetaCatalogBatchStatus'

export async function syncMetaCatalog(input: {
  accessToken: string
  fetchImpl?: typeof fetch
}) {
  const products = await getAllProductsForCatalogSync()
  const plan = buildMetaCatalogSyncPlan(products)
  const response = await postMetaCatalogItemsBatch({
    accessToken: input.accessToken,
    requests: plan.requests,
    ...(input.fetchImpl ? { fetchImpl: input.fetchImpl } : {})
  })
  const handle = response.handles[0]

  if (!handle) {
    throw new Error('Meta Catalog API did not return a batch handle')
  }

  const batchStatus = await waitForMetaCatalogBatchStatus({
    accessToken: input.accessToken,
    handle,
    ...(input.fetchImpl ? { fetchImpl: input.fetchImpl } : {})
  })

  return {
    catalogId: plan.catalogId,
    graphApiVersion: plan.graphApiVersion,
    offerCount: plan.offerCount,
    publishedCount: plan.publishedCount,
    deleteCount: plan.deleteCount,
    requestCount: plan.requestCount,
    publishedGroupCount: plan.publishedGroupCount,
    missingGtinCount: plan.missingGtinCount,
    missingMpnCount: plan.missingMpnCount,
    shopifyCheckoutLinkCount: plan.shopifyCheckoutLinkCount,
    imageCount: plan.imageCount,
    videoCount: plan.videoCount,
    handle,
    validationStatus: response.validation_status,
    batchStatus
  }
}
