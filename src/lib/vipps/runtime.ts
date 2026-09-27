import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { createVippsClient } from './client'
import { getVippsConfig } from './config'
import { createVippsShopifyOrders } from './shopifyOrder'

let runtime: ReturnType<typeof buildRuntime> | undefined
function buildRuntime() {
  const config = getVippsConfig()
  const origin = process.env.VIPPS_CHECKOUT_ORIGIN
  const secret = process.env.VIPPS_CHECKOUT_SECRET
  if (!origin || !secret || secret.length < 32)
    throw new Error('Vipps checkout configuration missing')
  const url = new URL(origin)
  if (url.protocol !== 'https:' || url.origin !== origin)
    throw new Error(
      'VIPPS_CHECKOUT_ORIGIN must be an HTTPS origin'
    )
  if (
    config.environment === 'production' &&
    config.msn !== '728093'
  )
    throw new Error('Unexpected production Vipps sales unit')
  return {
    config,
    origin,
    secret,
    client: createVippsClient(config),
    shopify: createVippsShopifyOrders(config)
  }
}
export function getVippsRuntime() {
  // Rollback can disable NEW checkouts without stranding payments already authorized.
  runtime ??= buildRuntime()
  return runtime
}

export function vippsStatusToken(
  reference: string,
  secret: string
) {
  return createHmac('sha256', secret)
    .update(`vipps-status-v1:${reference}`)
    .digest('base64url')
}
export function verifyVippsStatusToken(
  reference: string,
  token: string,
  secret: string
) {
  const expected = Buffer.from(
    vippsStatusToken(reference, secret)
  )
  const actual = Buffer.from(token)
  return (
    expected.length === actual.length &&
    timingSafeEqual(expected, actual)
  )
}
