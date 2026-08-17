import { after } from 'next/server'

import { shopifyCheckoutObservationSchema } from '@/lib/analytics/shopifyCheckoutObservationContract'

import { handleShopifyCheckoutObservation } from '@/lib/analytics/server/handleShopifyCheckoutObservation'

import { postgresShopifyCheckoutObservationStore } from '@/lib/analytics/server/postgresShopifyCheckoutObservationStore'

import { postgresCanonicalEventStore } from '@/lib/analytics/server/postgresCanonicalPageViewStore'

import { promoteShopifyAddPaymentInfoObservation } from '@/lib/analytics/server/promoteShopifyAddPaymentInfoObservation'

import { promoteShopifyAddShippingInfoObservation } from '@/lib/analytics/server/promoteShopifyAddShippingInfoObservation'

import { readShopifyAddPaymentInfoCanonicalConfig } from '@/lib/analytics/server/shopifyAddPaymentInfoCanonicalConfig'

import { reconcileShopifyCheckoutObservation } from '@/lib/commerce/checkoutSession/reconcileShopifyCheckoutAttempt'

export const maxDuration = 60

async function reconcileRegistryObservation(
  request: Request
): Promise<void> {
  try {
    const candidate = await request.json()

    const parsed =
      shopifyCheckoutObservationSchema.safeParse(candidate)

    if (!parsed.success) {
      return
    }

    await reconcileShopifyCheckoutObservation(parsed.data)
  } catch {
    /*
     * Checkout Session Registry reconciliation is
     * operational shadow state for this public
     * observed-only source.
     *
     * It must never alter the HTTP semantics of the
     * already accepted durable observation, expose
     * checkout tokens, or interfere with canonical
     * analytics promotion.
     */
  }
}

async function handle(request: Request) {
  /*
   * Keep an untouched copy before the main handler
   * consumes the request body.
   *
   * Only POST can contain an observation.
   */
  const registryRequest =
    request.method === 'POST' ? request.clone() : null

  const response = await handleShopifyCheckoutObservation(
    request,
    {
      enabled:
        process.env.SHOPIFY_CHECKOUT_OBSERVATIONS_ENABLED ===
        'true',

      promote: observation => {
        const dependencies = {
          config: readShopifyAddPaymentInfoCanonicalConfig(
            process.env
          ),

          environment: 'production' as const,

          store: {
            ...postgresCanonicalEventStore,

            find: postgresCanonicalEventStore.find!
          }
        }

        return observation.eventName ===
          'checkout_shipping_info_submitted' ?
            promoteShopifyAddShippingInfoObservation(
              observation,
              dependencies
            )
          : promoteShopifyAddPaymentInfoObservation(
              observation,
              dependencies
            )
      },

      store: postgresShopifyCheckoutObservationStore
    }
  )

  /*
   * Reconcile only after the established receiver
   * accepted the observation.
   *
   * Therefore:
   *
   * - malformed payloads do not reach Registry
   * - persistence conflicts do not reach Registry
   * - storage failures do not reach Registry
   * - canonical promotion failures remain retryable
   *
   * The existing HTTP response remains unchanged.
   */
  if (registryRequest && response.status === 204) {
    after(async () => {
      await reconcileRegistryObservation(registryRequest)
    })
  }

  return response
}

export function POST(request: Request) {
  return handle(request)
}

export function OPTIONS(request: Request) {
  return handle(request)
}
