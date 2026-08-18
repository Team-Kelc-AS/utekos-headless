import type {
  KlarnaCollectedShippingAddress,
  KlarnaExpressOrderPayload
} from '@/components/klarna/schemas/klarnaExpressOrderSchema'
import { shopifyAdminGraphql } from '@/lib/shopify/shopifyAdminGraphql'
import type { CheckoutAttributionSnapshot } from '@/lib/analytics/checkoutAttributionSnapshot'
import { buildKlarnaExpressOrderAttributes } from './buildKlarnaExpressOrderAttributes'
import type { Cart } from 'types/cart'

type ShopifyDraftOrderCreateResponse = {
  draftOrderCreate: {
    draftOrder: { id: string } | null
    userErrors: { field: string[] | null; message: string }[]
  }
}

type ShopifyDraftOrderCompleteResponse = {
  draftOrderComplete: {
    draftOrder: {
      order: { id: string; name: string } | null
    } | null
    userErrors: { field: string[] | null; message: string }[]
  }
}

type CreateOrderFromKlarnaExpressInput = {
  cart: Cart | null
  orderPayload: KlarnaExpressOrderPayload
  collectedShippingAddress: KlarnaCollectedShippingAddress
  klarnaOrderId: string
  attribution?: CheckoutAttributionSnapshot
}

type ShopifyAddressInput = {
  firstName?: string
  lastName?: string
  address1?: string
  address2?: string
  city?: string
  province?: string
  zip?: string
  countryCode?: string
  phone?: string
}

function optionalStringField<
  Key extends keyof ShopifyAddressInput
>(
  key: Key,
  value: string | undefined
): Pick<ShopifyAddressInput, Key> | Record<string, never> {
  return value ?
      ({ [key]: value } as Pick<ShopifyAddressInput, Key>)
    : {}
}

function mapKlarnaAddressToShopify(
  address: KlarnaCollectedShippingAddress
): ShopifyAddressInput {
  return {
    ...optionalStringField('firstName', address.given_name),
    ...optionalStringField('lastName', address.family_name),
    ...optionalStringField('address1', address.street_address),
    ...optionalStringField('address2', address.street_address2),
    ...optionalStringField('city', address.city),
    ...optionalStringField('province', address.region),
    ...optionalStringField('zip', address.postal_code),
    ...optionalStringField(
      'countryCode',
      address.country?.toUpperCase()
    ),
    ...optionalStringField('phone', address.phone)
  }
}

function buildLineItemsFromCart(cart: Cart) {
  return cart.lines.map(line => ({
    variantId: line.merchandise.id,
    quantity: line.quantity
  }))
}

function buildLineItemsFromPayload(
  orderPayload: KlarnaExpressOrderPayload
) {
  return orderPayload.order_lines
    .filter(line => line.reference)
    .map(line => ({
      variantId: line.reference as string,
      quantity: line.quantity
    }))
}

export async function createOrderFromKlarnaExpress({
  cart,
  orderPayload,
  collectedShippingAddress,
  klarnaOrderId,
  attribution
}: CreateOrderFromKlarnaExpressInput): Promise<{
  shopifyOrderId: string
  shopifyOrderName: string
}> {
  const lineItems =
    cart && cart.lines.length > 0 ?
      buildLineItemsFromCart(cart)
    : buildLineItemsFromPayload(orderPayload)

  if (lineItems.length === 0) {
    throw new Error(
      'No Shopify line items available for Klarna express order'
    )
  }

  const shippingAddress = mapKlarnaAddressToShopify(
    collectedShippingAddress
  )
  const billingAddress = shippingAddress

  const draftOrderCreateMutation = `
    mutation draftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const draftOrderCompleteMutation = `
    mutation draftOrderComplete($id: ID!, $paymentPending: Boolean) {
      draftOrderComplete(id: $id, paymentPending: $paymentPending) {
        draftOrder {
          order {
            id
            name
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const draftCreateData =
    await shopifyAdminGraphql<ShopifyDraftOrderCreateResponse>(
      draftOrderCreateMutation,
      {
        input: {
          email: collectedShippingAddress.email,
          lineItems,
          shippingAddress,
          billingAddress,
          tags: ['klarna-express'],
          note: `Klarna express checkout order ${klarnaOrderId}`,
          customAttributes: buildKlarnaExpressOrderAttributes({
            klarnaOrderId,
            ...(attribution ? { attribution } : {}),
            productContextItems:
              cart?.lines.map(line => ({
                item_id: line.merchandise.id,
                item_brand: line.merchandise.product.vendor,
                product_type:
                  line.merchandise.product.productType
              })) ?? []
          })
        }
      }
    )

  const draftCreateErrors =
    draftCreateData.draftOrderCreate.userErrors

  if (draftCreateErrors.length > 0) {
    throw new Error(
      `Shopify draft order creation failed: ${draftCreateErrors.map(error => error.message).join(', ')}`
    )
  }

  const draftOrderId =
    draftCreateData.draftOrderCreate.draftOrder?.id

  if (!draftOrderId) {
    throw new Error(
      'Shopify draft order creation returned no draft order id'
    )
  }

  const draftCompleteData =
    await shopifyAdminGraphql<ShopifyDraftOrderCompleteResponse>(
      draftOrderCompleteMutation,
      { id: draftOrderId, paymentPending: false }
    )

  const draftCompleteErrors =
    draftCompleteData.draftOrderComplete.userErrors

  if (draftCompleteErrors.length > 0) {
    throw new Error(
      `Shopify draft order completion failed: ${draftCompleteErrors.map(error => error.message).join(', ')}`
    )
  }

  const order =
    draftCompleteData.draftOrderComplete.draftOrder?.order

  if (!order) {
    throw new Error(
      'Shopify draft order completion returned no order'
    )
  }

  return {
    shopifyOrderId: order.id,
    shopifyOrderName: order.name
  }
}
