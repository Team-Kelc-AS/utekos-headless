import 'server-only'
import type { CanonicalPurchase } from '../purchaseEvent'

// Operator-confirmed NOK costs excluding VAT, 2026-10-04.
// These are the cost basis of the Stape POAS feed; never import into client code.
const UNIT_COST_NOK: Readonly<Record<string, number>> = {
  '42903231004920': 600,
  '42903231037688': 600,
  '42903231070456': 600,
  '42903231103224': 600,
  '42903234609400': 900,
  '42903234642168': 900,
  '42903234674936': 900,
  '42903234707704': 900,
  '42903954292984': 50,
  '43959919051000': 340,
  '43959919083768': 340,
  '43959919116536': 340,
  '46944403849464': 556,
  '46944403882232': 556,
  '46944403915000': 556,
  '48249962135800': 556,
  '67548601123064': 559,
  '67548601155832': 559,
  '67548601188600': 559,
}

export function calculatePurchaseProfit(
  commerce: CanonicalPurchase['custom_data']
): number | undefined {
  if (commerce.currency !== 'NOK' || commerce.items.length === 0) return
  let cost = 0
  for (const item of commerce.items) {
    const id = item.item_id.replace(/^gid:\/\/shopify\/ProductVariant\//, '')
    const unitCost = UNIT_COST_NOK[id]
    if (unitCost === undefined || !Number.isInteger(item.quantity) || item.quantity <= 0) return
    cost += unitCost * item.quantity
  }
  // item_revenue already excludes VAT, shipping and all allocated discounts.
  // Legacy canonical unit_price excludes item discounts; order discounts are separate.
  const revenue = commerce.item_revenue ?? (
    commerce.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
    - (commerce.transaction_discount ?? 0)
  )
  if (!Number.isFinite(revenue) || revenue < 0) return
  return Math.round((revenue - cost) * 100) / 100
}
