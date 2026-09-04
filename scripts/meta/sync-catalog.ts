import { getAllProductsForCatalogSync } from '../../src/lib/shopify/admin'
import { buildMetaCatalogSyncPlan } from '../../src/lib/merchant-feeds/meta/buildMetaCatalogSyncPlan'
import { postMetaCatalogItemsBatch } from '../../src/lib/merchant-feeds/meta/postMetaCatalogItemsBatch'
import { waitForMetaCatalogBatchStatus } from '../../src/lib/merchant-feeds/meta/waitForMetaCatalogBatchStatus'

async function main() {
  const apply = process.argv.includes('--apply')
  const products = await getAllProductsForCatalogSync()
  const plan = buildMetaCatalogSyncPlan(products)
  const report = {
    mode: apply ? 'apply' : 'dry-run',
    catalogId: plan.catalogId,
    graphApiVersion: plan.graphApiVersion,
    offerCount: plan.offerCount,
    publishedCount: plan.publishedCount,
    stagingCount: plan.stagingCount,
    publishedGroupCount: plan.publishedGroupCount,
    missingGtinCount: plan.missingGtinCount,
    missingMpnCount: plan.missingMpnCount,
    shopifyCheckoutLinkCount: plan.shopifyCheckoutLinkCount,
    imageCount: plan.imageCount,
    videoCount: plan.videoCount,
    offers: plan.offers.map(offer => ({
      id: offer.id,
      title: offer.title,
      availability: offer.availability,
      visibility: offer.visibility,
      link: offer.link,
      gtin: offer.gtin,
      mpn: offer.mpn,
      imageCount: offer.images.length,
      videoCount: offer.videos.length
    }))
  }

  if (!apply) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  const accessToken = process.env.CATALOG_API_TOKEN?.trim()

  if (!accessToken) {
    throw new Error('CATALOG_API_TOKEN is required for --apply')
  }

  const response = await postMetaCatalogItemsBatch({
    accessToken,
    requests: plan.requests
  })
  const handle = response.handles[0]

  if (!handle) {
    throw new Error('Meta Catalog API did not return a batch handle')
  }

  const batchStatus = await waitForMetaCatalogBatchStatus({
    accessToken,
    handle
  })

  console.log(
    JSON.stringify(
      {
        ...report,
        handle,
        validationStatus: response.validation_status,
        batchStatus
      },
      null,
      2
    )
  )
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
