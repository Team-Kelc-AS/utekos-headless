import * as z from '@/lib/validation/zodMini'
import {
  getKlarnaBasicAuthHeader,
  getKlarnaServerConfig
} from '@/lib/klarna/config'
import { klarnaCollectedShippingAddressSchema } from '@/components/klarna/schemas/klarnaExpressOrderSchema'

const klarnaManagedOrderSchema = z.object({
  order_id: z.string(),
  shipping_address: z.optional(
    klarnaCollectedShippingAddressSchema
  ),
  billing_address: z.optional(
    klarnaCollectedShippingAddressSchema
  )
})

export type KlarnaManagedOrder = z.infer<
  typeof klarnaManagedOrderSchema
>

export async function getKlarnaManagedOrder(
  orderId: string
): Promise<KlarnaManagedOrder> {
  const config = getKlarnaServerConfig()
  const response = await fetch(
    `${config.KLARNA_API_BASE_URL}/ordermanagement/v1/orders/${encodeURIComponent(orderId)}`,
    {
      method: 'GET',
      headers: {
        Authorization: getKlarnaBasicAuthHeader(config),
        Accept: 'application/json'
      },
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
    throw new Error(
      `Klarna order management lookup failed (${response.status})`
    )
  }

  const parsed = klarnaManagedOrderSchema.safeParse(responseJson)

  if (!parsed.success) {
    throw new Error(
      'Klarna order management returned an invalid order payload'
    )
  }

  return parsed.data
}
