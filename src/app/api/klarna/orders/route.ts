import {
  klarnaCreateOrderRequestSchema,
  type KlarnaCreateOrderRequest
} from '@/components/klarna/schemas/klarnaExpressOrderSchema'
import { fetchCart } from '@/lib/helpers/cart/fetchCart'
import { getKlarnaMinorUnitAmount } from '@/components/klarna/utils/getKlarnaMinorUnitAmount'
import { createKlarnaOrderFromAuthorization } from '@/lib/klarna/createKlarnaOrderFromAuthorization'
import { createOrderFromKlarnaExpress } from '@/lib/shopify/createOrderFromKlarnaExpress'
import { KLARNA_EXPRESS_SESSION_KEY } from '@/components/klarna/constants/sessionStorage'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { readCartIdCookie } from '@/lib/cart/readCartIdCookie'
import { resolveFullShopifyCartId } from '@/lib/cart/parseShopifyCartId'
import { logKlarnaCheckoutStage } from '@/lib/observability/logging/logKlarnaCheckoutStage'
import { createStorefrontBuyerContext } from '@/api/shopify/storefront/createStorefrontBuyerContext'
import type { StorefrontBuyerContext } from '@/api/shopify/storefront/StorefrontGatewayContract'

async function verifyCartOwnership(
  context: StorefrontBuyerContext,
  shopifyCartId: string,
  orderPayload: KlarnaCreateOrderRequest['orderPayload']
) {
  const fullCartId = resolveFullShopifyCartId(
    shopifyCartId,
    await readCartIdCookie()
  )

  if (!fullCartId) {
    throw new Error('Cart ownership verification failed')
  }

  if (orderPayload.merchant_reference1 !== shopifyCartId) {
    throw new Error('Cart reference verification failed')
  }

  const cart = await fetchCart(context, fullCartId)

  if (!cart) {
    throw new Error('Cart not found for Klarna express checkout')
  }

  const cartAmountMinor = getKlarnaMinorUnitAmount({
    amount: cart.cost.totalAmount.amount,
    currencyCode: cart.cost.totalAmount.currencyCode
  })

  if (
    !cartAmountMinor ||
    Number(cartAmountMinor) !== orderPayload.order_amount
  ) {
    throw new Error(
      'Cart amount does not match Klarna order payload'
    )
  }

  return cart
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now()
  let body: unknown

  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    )
  }

  const parsed = klarnaCreateOrderRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid request body',
        details: parsed.error.flatten()
      },
      { status: 400 }
    )
  }

  const {
    authorizationToken,
    orderPayload,
    collectedShippingAddress,
    shopifyCartId,
    attribution
  } = parsed.data

  await logKlarnaCheckoutStage({
    durationMs: Date.now() - startedAt,
    request: req,
    stage: 'order_request_received'
  })

  try {
    const context = createStorefrontBuyerContext(req.headers)
    const cart = await verifyCartOwnership(
      context,
      shopifyCartId,
      orderPayload
    )

    const klarnaOrder = await createKlarnaOrderFromAuthorization(
      {
        authorizationToken,
        orderPayload,
        collectedShippingAddress
      }
    )

    const shopifyOrder = await createOrderFromKlarnaExpress({
      cart,
      orderPayload,
      collectedShippingAddress,
      klarnaOrderId: klarnaOrder.order_id,
      ...(attribution ? { attribution } : {})
    })

    await logKlarnaCheckoutStage({
      durationMs: Date.now() - startedAt,
      request: req,
      stage: 'order_created'
    })

    return NextResponse.json({
      klarna_order_id: klarnaOrder.order_id,
      redirect_url: klarnaOrder.redirect_url,
      fraud_status: klarnaOrder.fraud_status,
      shopify_order_id: shopifyOrder.shopifyOrderId,
      shopify_order_name: shopifyOrder.shopifyOrderName,
      session_storage_key: KLARNA_EXPRESS_SESSION_KEY
    })
  } catch (error) {
    await logKlarnaCheckoutStage({
      durationMs: Date.now() - startedAt,
      request: req,
      stage: 'order_creation_failed'
    })

    const message =
      error instanceof Error ?
        error.message
      : 'Klarna express checkout failed'

    return NextResponse.json({ error: message }, { status: 422 })
  }
}
