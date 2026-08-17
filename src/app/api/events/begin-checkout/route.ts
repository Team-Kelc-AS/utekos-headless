import {
  after
} from 'next/server'

import {
  geolocation,
  ipAddress
} from '@vercel/functions'

import {
  handleCanonicalBeginCheckoutRequest
} from '@/lib/analytics/server/handleCanonicalBeginCheckoutRequest'

import {
  handleCanonicalBeginCheckoutRoute
} from '@/lib/analytics/server/handleCanonicalBeginCheckoutRoute'

import {
  postgresCanonicalEventStore
} from '@/lib/analytics/server/postgresCanonicalPageViewStore'

import {
  fetchCanonicalBeginCheckoutCart
} from '@/lib/commerce/checkoutSession/fetchCanonicalBeginCheckoutCart'

import {
  registerCanonicalBeginCheckoutAttempt
} from '@/lib/commerce/checkoutSession/registerCanonicalBeginCheckoutAttempt'

export const maxDuration =
  60

function shouldRegisterCheckoutAttempt(
  response: Response
): boolean {
  /**
   * handleCanonicalBeginCheckoutRequest:
   *
   * 202 = newly accepted canonical event
   * 200 = duplicate canonical event
   *
   * Both are valid Registry handoffs because
   * Registry registration is itself idempotent.
   *
   * 204 consent rejection and all 4xx/5xx responses
   * must not create a canonical CheckoutAttempt.
   */
  return (
    response.status === 202 ||
    response.status === 200
  )
}

export function POST(
  request: Request
) {
  return handleCanonicalBeginCheckoutRoute(
    request,
    {
      collect:
        async currentRequest => {
          /**
           * Clone BEFORE the canonical handler consumes
           * the request body.
           *
           * The clone is used only after the canonical
           * event has been accepted/confirmed duplicate.
           */
          const registryRequest =
            currentRequest.clone()

          const response =
            await handleCanonicalBeginCheckoutRequest(
              currentRequest,
              {
                getRequestContext:
                  requestWithContext => {
                    const geo =
                      geolocation(
                        requestWithContext
                      )

                    const clientIpAddress =
                      ipAddress(
                        requestWithContext
                      )

                    const userAgent =
                      requestWithContext
                        .headers
                        .get(
                          'user-agent'
                        )

                    return {
                      ...(geo.city ?
                        {
                          city:
                            geo.city
                        }
                      : {}),

                      ...(clientIpAddress ?
                        {
                          clientIpAddress
                        }
                      : {}),

                      ...(geo.country ?
                        {
                          countryCode:
                            geo.country
                        }
                      : {}),

                      ...(geo.postalCode ?
                        {
                          postalCode:
                            geo.postalCode
                        }
                      : {}),

                      ...(geo.countryRegion ?
                        {
                          regionCode:
                            geo.countryRegion
                        }
                      : {}),

                      ...(userAgent ?
                        {
                          userAgent
                        }
                      : {})
                    }
                  },

                store:
                  postgresCanonicalEventStore
              }
            )

          if (
            shouldRegisterCheckoutAttempt(
              response
            )
          ) {
            /**
             * Do not make canonical collector latency
             * dependent on:
             *
             * - Shopify Storefront API
             * - Redis in another region
             * - Registry materialization
             * - Redis Stream append
             *
             * Next.js after() keeps the work attached to
             * this request lifecycle while allowing the
             * HTTP response to finish first.
             */
            after(
              async () => {
                try {
                  const result =
                    await registerCanonicalBeginCheckoutAttempt(
                      registryRequest,
                      {
                        fetchCart:
                          fetchCanonicalBeginCheckoutCart
                      }
                    )

                  console.info(
                    '[checkout-session] canonical begin_checkout registry handoff',
                    {
                      status:
                        result.status,

                      journalStatus:
                        result.journal_status,

                      ...(
                        'attempt_id' in
                          result ?
                          {
                            attemptId:
                              result
                                .attempt_id
                          }
                        : {}
                      )
                    }
                  )
                } catch (error) {
                  /**
                   * Canonical event persistence has already
                   * succeeded.
                   *
                   * Registry enrichment is deliberately
                   * failure-isolated here.
                   *
                   * Never log:
                   * - authenticated Cart GID
                   * - Shopify checkout/recovery URL
                   * - Klarna authorization token
                   * - customer PII
                   */
                  console.error(
                    '[checkout-session] canonical begin_checkout registry handoff failed',
                    {
                      error:
                        error instanceof Error ?
                          error.message
                        : 'unknown_error'
                    }
                  )
                }
              }
            )
          }

          return response
        }
    }
  )
}