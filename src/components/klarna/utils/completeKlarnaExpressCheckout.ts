import {
  klarnaCollectedShippingAddressSchema,
  type KlarnaCollectedShippingAddress,
  type KlarnaExpressOrderPayload
} from '@/components/klarna/schemas/klarnaExpressOrderSchema'
import { KLARNA_EXPRESS_SESSION_KEY } from '@/components/klarna/constants/sessionStorage'
import { captureBrowserCheckoutAttributionSnapshot } from '@/lib/analytics/captureBrowserCheckoutAttributionSnapshot'
import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError'

type CompleteKlarnaExpressCheckoutInput = {
  authorizationToken: string
  orderPayload: KlarnaExpressOrderPayload
  collectedShippingAddress: KlarnaCollectedShippingAddress
  shopifyCartId: string
}

type CompleteKlarnaExpressCheckoutResult = {
  klarna_order_id: string
  redirect_url: string
  fraud_status?: string
  shopify_order_id: string
  shopify_order_name: string
}

export async function completeKlarnaExpressCheckout({
  authorizationToken,
  orderPayload,
  collectedShippingAddress,
  shopifyCartId
}: CompleteKlarnaExpressCheckoutInput): Promise<CompleteKlarnaExpressCheckoutResult> {
  const validatedAddress =
    klarnaCollectedShippingAddressSchema.parse(
      collectedShippingAddress
    )
  let attribution:
    | Awaited<
        ReturnType<
          typeof captureBrowserCheckoutAttributionSnapshot
        >
      >
    | undefined

  try {
    attribution =
      await captureBrowserCheckoutAttributionSnapshot()
  } catch (error) {
    reportClientCaughtError(
      error,
      'begin_checkout.klarna_attribution_handoff'
    )
  }

  const response = await fetch('/api/klarna/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authorizationToken,
      orderPayload,
      collectedShippingAddress: validatedAddress,
      shopifyCartId,
      ...(attribution ? { attribution } : {})
    })
  })

  const responseBody = (await response.json()) as
    | CompleteKlarnaExpressCheckoutResult
    | { error?: string }

  if (!response.ok) {
    const message =
      'error' in responseBody && responseBody.error ?
        responseBody.error
      : 'Klarna express checkout failed'

    throw new Error(message)
  }

  const result =
    responseBody as CompleteKlarnaExpressCheckoutResult

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(
      KLARNA_EXPRESS_SESSION_KEY,
      JSON.stringify({
        klarna_order_id: result.klarna_order_id,
        shopify_order_id: result.shopify_order_id,
        shopify_order_name: result.shopify_order_name
      })
    )
  }

  return result
}
