import { handleShopifyCheckoutObservation } from '@/lib/analytics/server/handleShopifyCheckoutObservation'
import { ShopifyCheckoutObservationFileStore } from '@/lib/analytics/server/shopifyCheckoutObservationFileStore'

const store = new ShopifyCheckoutObservationFileStore()

function handle(request: Request) {
  return handleShopifyCheckoutObservation(request, {
    enabled: process.env.NODE_ENV === 'development',
    store
  })
}

export function POST(request: Request) {
  return handle(request)
}

export function OPTIONS(request: Request) {
  return handle(request)
}
