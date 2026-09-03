import { parseOrderConsentFromNoteAttributes } from '../checkoutConsentSnapshot'
import {
  canonicalRefundSchema,
  deterministicRefundEventId,
  shopifyRefundRecordId,
  type CanonicalRefund
} from '../refundEvent'
import { shopifyPurchaseTransactionId } from '../purchaseEvent'
import { resolveCanonicalEnvironment } from './resolveCanonicalEnvironment'
import {
  shopifyRefundWebhookSchema,
  type ShopifyRefundWebhook
} from './shopifyRefundWebhookPayload'

const unresolvedConsentSnapshot =
  parseOrderConsentFromNoteAttributes([])

function parseDecimal(value: number | string) {
  const parsed =
    typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('invalid_refund_decimal_amount')
  }
  return parsed
}

function resolveRefundCurrency(refund: ShopifyRefundWebhook) {
  const transactionCurrency = refund.transactions.find(
    transaction =>
      typeof transaction.currency === 'string' &&
      transaction.currency.length > 0
  )?.currency

  if (transactionCurrency)
    return transactionCurrency.toUpperCase()

  throw new Error(
    'Shopify refund webhook requires a transaction currency'
  )
}

function resolveRefundValue(refund: ShopifyRefundWebhook) {
  return refund.transactions.reduce(
    (sum, transaction) => sum + parseDecimal(transaction.amount),
    0
  )
}

function mapRefundItems(refund: ShopifyRefundWebhook) {
  return refund.refund_line_items.map(refundLineItem => {
    const lineItem = refundLineItem.line_item
    const itemId =
      lineItem.variant_id !== null ?
        String(lineItem.variant_id)
      : String(lineItem.id)
    const quantity = refundLineItem.quantity
    const unitPrice =
      quantity > 0 ?
        parseDecimal(refundLineItem.subtotal) / quantity
      : parseDecimal(lineItem.price)

    return {
      item_id: itemId,
      item_name: lineItem.name || lineItem.title,
      quantity,
      unit_price: unitPrice,
      ...(lineItem.sku ? { sku: lineItem.sku } : {})
    }
  })
}

export function shopifyRefundToCanonicalRefund(
  refund: ShopifyRefundWebhook
): CanonicalRefund {
  const parsedRefund = shopifyRefundWebhookSchema.parse(refund)
  const refundLegacyId = String(parsedRefund.id)
  const orderLegacyId = String(parsedRefund.order_id)
  const items = mapRefundItems(parsedRefund)

  return canonicalRefundSchema.parse({
    schema_version: 1,
    event_name: 'refund',
    event_id: deterministicRefundEventId(refundLegacyId),
    event_time: parsedRefund.created_at,
    source: 'webhook',
    environment: resolveCanonicalEnvironment(),
    consent: unresolvedConsentSnapshot,
    custom_data: {
      currency: resolveRefundCurrency(parsedRefund),
      value: resolveRefundValue(parsedRefund),
      transaction_id:
        shopifyPurchaseTransactionId(orderLegacyId),
      refund_id: shopifyRefundRecordId(refundLegacyId),
      items
    }
  })
}
