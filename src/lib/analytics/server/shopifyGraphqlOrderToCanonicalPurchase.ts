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
import {
  mapShopifyGraphqlOrderPurchasePricing,
  readShopifyGraphqlMoneyAmount
} from './mapShopifyGraphqlOrderPurchasePricing'
import { parseAbsoluteHttpUrl } from './parseAbsoluteHttpUrl'
import { resolveCanonicalEnvironment } from './resolveCanonicalEnvironment'
import type { ShopifyCommerceReconciliationOrder } from './shopifyCommerceReconciliationGraphqlSchema'

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

function mapCustomAttributesToNoteAttributes(
  order: ShopifyCommerceReconciliationOrder
) {
  return order.customAttributes
    .filter(
      (attribute): attribute is { key: string; value: string } =>
        typeof attribute.value === 'string'
    )
    .map(attribute => ({
      name: attribute.key,
      value: attribute.value
    }))
}

function mapOrderLocation(
  order: ShopifyCommerceReconciliationOrder
) {
  const address = order.shippingAddress ?? order.billingAddress
  if (!address) return undefined

  const location = {
    ...(address.city ? { city: address.city } : {}),
    ...(address.countryCodeV2 ?
      { country_code: address.countryCodeV2.toUpperCase() }
    : {}),
    ...(address.zip ? { postal_code: address.zip } : {}),
    ...(address.provinceCode ?
      { region_code: address.provinceCode }
    : {})
  }

  return Object.keys(location).length > 0 ?
      { ...location, source: 'customer_provided' as const }
    : undefined
}

export function shopifyGraphqlOrderToCanonicalPurchase(
  order: ShopifyCommerceReconciliationOrder
): CanonicalPurchase {
  const orderLegacyId = String(order.legacyResourceId)
  const email =
    order.email ??
    order.customer?.defaultEmailAddress?.emailAddress ??
    undefined
  const emailHash = hashEmail(email)
  const phoneHash = hashPhone(
    order.phone,
    order.customer?.defaultPhoneNumber?.phoneNumber,
    order.shippingAddress?.phone,
    order.billingAddress?.phone
  )
  const attribution = parseOrderAttributionFromNoteAttributes(
    mapCustomAttributesToNoteAttributes(order)
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
  const firstVisit = order.customerJourneySummary?.firstVisit
  const pageUrl =
    attribution.page_url ??
    parseAbsoluteHttpUrl(firstVisit?.landingPage) ??
    parseAbsoluteHttpUrl(order.statusPageUrl)
  const referrerUrl =
    attribution.referrer_url ??
    parseAbsoluteHttpUrl(firstVisit?.referrerUrl)
  const location =
    attribution.consent.marketing === 'granted' ?
      mapOrderLocation(order)
    : undefined
  const currency = (
    order.presentmentCurrencyCode || order.currencyCode
  ).toUpperCase()
  const pricing = mapShopifyGraphqlOrderPurchasePricing(
    order,
    currency
  )

  if (!order.name) {
    throw new Error('Shopify GraphQL order requires a name')
  }

  const userData = {
    ...(emailHash ? { email_sha256: [emailHash] } : {}),
    ...(phoneHash ? { phone_sha256: [phoneHash] } : {})
  }

  return canonicalPurchaseSchema.parse({
    schema_version: 1,
    event_name: 'purchase',
    event_id: deterministicPurchaseEventId(orderLegacyId),
    event_time: order.processedAt ?? order.createdAt,
    source: 'server',
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
    : order.customer?.legacyResourceId ?
      {
        external_id: `shopify_customer_${order.customer.legacyResourceId}`
      }
    : {}),
    ...(order.clientIp ?
      { client_ip_address: order.clientIp }
    : {}),
    ...(location ? { location } : {}),
    ...(Object.keys(userData).length > 0 ?
      { user_data: userData }
    : {}),
    custom_data: {
      currency,
      value: readShopifyGraphqlMoneyAmount(
        order.totalPriceSet,
        currency,
        'total price'
      ),
      item_revenue: pricing.itemRevenue,
      tax_value: readShopifyGraphqlMoneyAmount(
        order.totalTaxSet,
        currency,
        'total tax'
      ),
      shipping_value: readShopifyGraphqlMoneyAmount(
        order.totalShippingPriceSet,
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
      order_name: order.name,
      items: pricing.items
    }
  })
}
