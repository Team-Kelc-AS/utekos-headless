import type { OrderPaid } from 'types/commerce/order/OrderPaid'
import { ensureFbclidFromFbc } from '../extractFbclidFromFbc'
import { parseOrderAttributionFromNoteAttributes } from '../checkoutAttributionSnapshot'
import {
  canonicalPurchaseSchema,
  deterministicPurchaseEventId,
  shopifyPurchaseTransactionId,
  type CanonicalPurchase
} from '../purchaseEvent'
import { hashCustomerMatchIdentifier } from '@/lib/google/data-manager/hashCustomerMatchIdentifier'
import { normalizeCustomerMatchEmail } from '@/lib/google/data-manager/normalizeCustomerMatchEmail'
import { normalizeCustomerMatchPhone } from '@/lib/google/data-manager/normalizeCustomerMatchPhone'
import { mapShopifyOrderPurchasePricing } from './mapShopifyOrderPurchasePricing'
import { parseAbsoluteHttpUrl } from './parseAbsoluteHttpUrl'
import { readShopifyMoneyAmount } from './readShopifyMoneyAmount'
import { resolveCanonicalEnvironment } from './resolveCanonicalEnvironment'
import { parseOrderProductContextFromNoteAttributes } from '../checkoutProductContext'

function hashEmail(email: string | null | undefined) {
  if (!email) return undefined

  const normalized = normalizeCustomerMatchEmail(email)
  return normalized ?
      hashCustomerMatchIdentifier(normalized)
    : undefined
}

function hashPhone(
  ...phoneCandidates: Array<string | null | undefined>
) {
  for (const phone of phoneCandidates) {
    if (!phone) continue

    const normalized = normalizeCustomerMatchPhone(phone)
    if (normalized) {
      return hashCustomerMatchIdentifier(normalized)
    }
  }

  return undefined
}

function readClientUserAgent(order: OrderPaid) {
  const clientDetails = order.client_details

  if (
    typeof clientDetails === 'object' &&
    clientDetails !== null &&
    typeof clientDetails.user_agent === 'string' &&
    clientDetails.user_agent.length > 0
  ) {
    return clientDetails.user_agent
  }

  return undefined
}

function mapOrderLocation(order: OrderPaid) {
  const address = order.shipping_address ?? order.billing_address
  if (!address) return undefined

  const location = {
    ...(address.city ? { city: address.city } : {}),
    ...(address.country_code ?
      { country_code: address.country_code.toUpperCase() }
    : {}),
    ...(address.zip ? { postal_code: address.zip } : {}),
    ...(address.province_code ?
      { region_code: address.province_code }
    : {})
  }

  return Object.keys(location).length > 0 ?
      { ...location, source: 'customer_provided' as const }
    : undefined
}

export function shopifyOrderToCanonicalPurchase(
  order: OrderPaid
): CanonicalPurchase {
  const orderLegacyId = String(order.id)
  const email =
    order.email ?? order.contact_email ?? order.customer?.email
  const emailHash = hashEmail(email)
  const phoneHash = hashPhone(
    order.phone,
    order.customer?.phone,
    order.shipping_address?.phone,
    order.billing_address?.phone
  )
  const userAgent = readClientUserAgent(order)
  const attribution = parseOrderAttributionFromNoteAttributes(
    order.note_attributes
  )
  const clickId =
    attribution.consent.marketing === 'granted' ?
      ensureFbclidFromFbc({
        ...(attribution.browser_id ?
          { browser_id: attribution.browser_id }
        : {}),
        ...(attribution.click_id ?
          { click_id: attribution.click_id }
        : {})
      })
    : attribution.click_id
  const pageUrl =
    attribution.page_url ??
    parseAbsoluteHttpUrl(order.landing_site) ??
    parseAbsoluteHttpUrl(order.order_status_url)
  const referrerUrl =
    attribution.referrer_url ??
    parseAbsoluteHttpUrl(order.referring_site)
  const location =
    attribution.consent.marketing === 'granted' ?
      mapOrderLocation(order)
    : undefined
  const currency = (
    order.presentment_currency || order.currency
  ).toUpperCase()
  const pricing = mapShopifyOrderPurchasePricing(
    order,
    currency,
    parseOrderProductContextFromNoteAttributes(
      order.note_attributes
    )
  )

  const userData = {
    ...(emailHash ? { email_sha256: [emailHash] } : {}),
    ...(phoneHash ? { phone_sha256: [phoneHash] } : {})
  }

  return canonicalPurchaseSchema.parse({
    schema_version: 1,
    event_name: 'purchase',
    event_id: deterministicPurchaseEventId(orderLegacyId),
    event_time: order.processed_at ?? order.created_at,
    source: 'webhook',
    environment: resolveCanonicalEnvironment(),
    ...(pageUrl ? { page_url: pageUrl } : {}),
    ...(referrerUrl ? { referrer_url: referrerUrl } : {}),
    consent: attribution.consent,
    ...(attribution.browser_id ?
      { browser_id: attribution.browser_id }
    : {}),
    ...(clickId ? { click_id: clickId } : {}),
    ...(attribution.external_id ?
      { external_id: attribution.external_id }
    : order.customer?.id ?
      { external_id: `shopify_customer_${order.customer.id}` }
    : {}),
    ...(order.browser_ip ?
      { client_ip_address: order.browser_ip }
    : {}),
    ...(userAgent ?
      { event_device_info: { user_agent: userAgent } }
    : {}),
    ...(location ? { location } : {}),
    ...(Object.keys(userData).length > 0 ?
      { user_data: userData }
    : {}),
    custom_data: {
      currency,
      value: readShopifyMoneyAmount(
        order.total_price_set,
        currency,
        'total price'
      ),
      item_revenue: pricing.itemRevenue,
      tax_value: readShopifyMoneyAmount(
        order.total_tax_set,
        currency,
        'total tax'
      ),
      shipping_value: readShopifyMoneyAmount(
        order.total_shipping_price_set,
        currency,
        'total shipping price'
      ),
      ...(pricing.transactionDiscount === undefined ?
        {}
      : { transaction_discount: pricing.transactionDiscount }),
      ...(pricing.couponCodes ?
        { coupon_codes: pricing.couponCodes }
      : {}),
      transaction_id:
        shopifyPurchaseTransactionId(orderLegacyId),
      order_name: order.name ?? String(order.order_number),
      items: pricing.items
    }
  })
}
