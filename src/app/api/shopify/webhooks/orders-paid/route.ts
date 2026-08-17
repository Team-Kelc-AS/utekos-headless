import { handleShopifyOrdersPaidWebhook } from '@/lib/analytics/server/handleShopifyOrdersPaidWebhook'
import { completeCheckoutSessionFromShopifyOrderPaid } from '@/lib/commerce/checkoutSession/completeCheckoutSessionFromShopifyOrderPaid'

export const maxDuration = 60

export function POST(request: Request) {
  return handleShopifyOrdersPaidWebhook(request, {
    completeCheckoutSession:
      completeCheckoutSessionFromShopifyOrderPaid
  })
}
