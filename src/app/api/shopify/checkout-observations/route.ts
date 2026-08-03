import { handleShopifyCheckoutObservation } from '@/lib/analytics/server/handleShopifyCheckoutObservation'
import { postgresShopifyCheckoutObservationStore } from '@/lib/analytics/server/postgresShopifyCheckoutObservationStore'

function handle(request: Request) {
  return handleShopifyCheckoutObservation(request, {
    enabled:
      process.env.SHOPIFY_CHECKOUT_OBSERVATIONS_ENABLED ===
      'true',
    store: postgresShopifyCheckoutObservationStore
  })
}

export function POST(request: Request) {
  return handle(request)
}

export function OPTIONS(request: Request) {
  return handle(request)
}
