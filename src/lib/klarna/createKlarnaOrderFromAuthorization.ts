import {
  klarnaCreateOrderResponseSchema,
  type KlarnaExpressOrderPayload
} from '@/components/klarna/schemas/klarnaExpressOrderSchema'
import {
  getKlarnaBasicAuthHeader,
  getKlarnaServerConfig
} from '@/lib/klarna/config'
import { applyShippingAddressToOrderPayload } from '@/lib/klarna/applyShippingAddressToOrderPayload'
import type { KlarnaCollectedShippingAddress } from '@/components/klarna/schemas/klarnaExpressOrderSchema'

type CreateKlarnaOrderInput = {
  authorizationToken: string
  orderPayload: KlarnaExpressOrderPayload
  collectedShippingAddress: KlarnaCollectedShippingAddress
}

export async function createKlarnaOrderFromAuthorization({
  authorizationToken,
  orderPayload,
  collectedShippingAddress
}: CreateKlarnaOrderInput) {
  const config = getKlarnaServerConfig()
  // Default Klarna behaviour is already non-capture, but set explicitly so
  // we stay covered by Merchant Protection (capture only at fulfillment).
  const requestBody = {
    ...applyShippingAddressToOrderPayload(
      orderPayload,
      collectedShippingAddress
    ),
    auto_capture: false as const
  }

  const response = await fetch(
    `${config.KLARNA_API_BASE_URL}/payments/v1/authorizations/${encodeURIComponent(authorizationToken)}/order`,
    {
      method: 'POST',
      headers: {
        'Authorization': getKlarnaBasicAuthHeader(config),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store'
    }
  )

  const responseText = await response.text()
  let responseJson: unknown = null

  if (responseText) {
    try {
      responseJson = JSON.parse(responseText) as unknown
    } catch {
      responseJson = null
    }
  }

  if (!response.ok) {
    const errorMessage =
      (
        typeof responseJson === 'object' &&
        responseJson !== null &&
        'error_messages' in responseJson &&
        Array.isArray(
          (responseJson as { error_messages?: string[] })
            .error_messages
        )
      ) ?
        (
          responseJson as { error_messages: string[] }
        ).error_messages.join(', ')
      : responseText ||
        `Klarna create order failed (${response.status})`

    throw new Error(errorMessage)
  }

  const parsed =
    klarnaCreateOrderResponseSchema.safeParse(responseJson)

  if (!parsed.success) {
    throw new Error(
      'Klarna create order returned an invalid response payload'
    )
  }

  return parsed.data
}
