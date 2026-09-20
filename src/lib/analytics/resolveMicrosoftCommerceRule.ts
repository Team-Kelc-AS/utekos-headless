import { microsoftCommerceRules } from './microsoftCommerceRules'
import type { CanonicalAddToCart } from './addToCartEvent'
import type { CanonicalPurchase } from './purchaseEvent'

export function resolveMicrosoftCommerceRule(
  event: CanonicalAddToCart | CanonicalPurchase
) {
  const rule = microsoftCommerceRules[event.event_name]
  const data = event.custom_data
  const transactionId =
    rule.transaction_id_source in data ?
      data[rule.transaction_id_source as keyof typeof data]
    : undefined
  if (typeof transactionId !== 'string' || !transactionId.length)
    throw new Error(`Invalid transaction source for ${rule.id}`)
  const itemPrices = data.items.map(item => {
    for (const source of rule.item_price_sources) {
      const value =
        source in item ?
          item[source as keyof typeof item]
        : undefined
      if (value !== null && value !== undefined) {
        if (
          typeof value !== 'number' ||
          !Number.isFinite(value) ||
          value < 0
        )
          throw new Error(`Invalid item price for ${rule.id}`)
        return value
      }
    }
    throw new Error(`Missing item price for ${rule.id}`)
  })
  return {
    browserEventName: rule.browser_event_name,
    itemPrices,
    serverEventName: rule.server_event_name,
    transactionId
  }
}
