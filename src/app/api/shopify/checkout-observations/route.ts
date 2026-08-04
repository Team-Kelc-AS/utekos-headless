import { handleShopifyCheckoutObservation } from '@/lib/analytics/server/handleShopifyCheckoutObservation'
import { postgresShopifyCheckoutObservationStore } from '@/lib/analytics/server/postgresShopifyCheckoutObservationStore'
import { postgresCanonicalEventStore } from '@/lib/analytics/server/postgresCanonicalPageViewStore'
import { promoteShopifyAddPaymentInfoObservation } from '@/lib/analytics/server/promoteShopifyAddPaymentInfoObservation'
import { readShopifyAddPaymentInfoCanonicalConfig } from '@/lib/analytics/server/shopifyAddPaymentInfoCanonicalConfig'

function handle(request: Request) {
  return handleShopifyCheckoutObservation(request, {
    enabled:
      process.env.SHOPIFY_CHECKOUT_OBSERVATIONS_ENABLED ===
      'true',
    promote: observation =>
      promoteShopifyAddPaymentInfoObservation(observation, {
        config:
          readShopifyAddPaymentInfoCanonicalConfig(process.env),
        environment: 'production',
        store: {
          ...postgresCanonicalEventStore,
          find: postgresCanonicalEventStore.find!
        }
      }),
    store: postgresShopifyCheckoutObservationStore
  })
}

export function POST(request: Request) {
  return handle(request)
}

export function OPTIONS(request: Request) {
  return handle(request)
}
