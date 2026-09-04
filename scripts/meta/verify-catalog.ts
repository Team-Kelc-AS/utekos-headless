import { getAllProductsForCatalogSync } from '../../src/lib/shopify/admin'
import { buildMetaCatalogSyncPlan } from '../../src/lib/merchant-feeds/meta/buildMetaCatalogSyncPlan'
import { getMetaCatalogProductReadback } from '../../src/lib/merchant-feeds/meta/getMetaCatalogProductReadback'
import { verifyMetaCatalogProductReadback } from '../../src/lib/merchant-feeds/meta/verifyMetaCatalogProductReadback'

async function main() {
  const accessToken = process.env.CATALOG_API_TOKEN?.trim()

  if (!accessToken) {
    throw new Error('CATALOG_API_TOKEN is required')
  }

  const products = await getAllProductsForCatalogSync()
  const plan = buildMetaCatalogSyncPlan(products)
  const readback = await getMetaCatalogProductReadback({ accessToken })
  const report = verifyMetaCatalogProductReadback({
    deleteOfferIds: plan.deleteOfferIds,
    offers: plan.offers,
    products: readback
  })

  console.log(JSON.stringify(report, null, 2))
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Unknown error')
  process.exitCode = 1
})
