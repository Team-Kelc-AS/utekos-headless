export const microsoftCommerceRules = {
  add_to_cart: {
    id: 'microsoft_uet.add_to_cart.commerce.v1',
    kind: 'microsoft_commerce' as const,
    event: 'add_to_cart' as const,
    provider: 'microsoft_uet' as const,
    browser_event_name: 'add_to_cart',
    server_event_name: 'add_to_cart',
    transaction_id_source: 'cart_mutation_id',
    transaction_id_targets: [
      'customData.transactionId',
      'customData.eventLabel'
    ],
    item_price_sources: ['unit_price'],
    item_price_target: 'customData.items[].price',
    selection: 'first_non_nullish',
    source: 'src/lib/analytics/microsoftCommerceRules.ts'
  },
  purchase: {
    id: 'microsoft_uet.purchase.commerce.v1',
    kind: 'microsoft_commerce' as const,
    event: 'purchase' as const,
    provider: 'microsoft_uet' as const,
    browser_event_name: null,
    server_event_name: 'purchase',
    transaction_id_source: 'transaction_id',
    transaction_id_targets: [
      'customData.transactionId',
      'customData.eventLabel'
    ],
    item_price_sources: ['final_unit_price', 'unit_price'],
    item_price_target: 'customData.items[].price',
    selection: 'first_non_nullish',
    source: 'src/lib/analytics/microsoftCommerceRules.ts'
  }
} as const
