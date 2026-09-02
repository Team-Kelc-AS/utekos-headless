import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalAddToCartSchema } from '../addToCartEvent'
import { canonicalBeginCheckoutSchema } from '../beginCheckoutEvent'
import {
  canonicalPageViewSchema,
  type CanonicalPageView
} from '../pageViewEvent'
import {
  canonicalPurchaseSchema,
  type CanonicalPurchase
} from '../purchaseEvent'
import { canonicalRefundSchema } from '../refundEvent'
import {
  canonicalViewItemSchema,
  type CanonicalViewItem
} from '../viewItemEvent'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'

const consent = {
  analytics: 'granted' as const,
  marketing: 'granted' as const,
  preferences: 'denied' as const,
  source: 'cookiebot' as const,
  version: '1'
}

const pinterestEnvKeys = [
  'PINTEREST_CONVERSIONS_API_ENABLED',
  'PINTEREST_CONVERSIONS_ACCESS_TOKEN',
  'PINTEREST_AD_ACCOUNT_ID'
] as const

function isolatePinterestEnv() {
  const previous = Object.fromEntries(
    pinterestEnvKeys.map(key => [key, process.env[key]])
  )

  for (const key of pinterestEnvKeys) {
    delete process.env[key]
  }

  return previous
}

function restorePinterestEnv(
  previous: Record<string, string | undefined>
) {
  for (const key of pinterestEnvKeys) {
    if (previous[key] === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = previous[key]
    }
  }
}

function withIsolatedPinterestEnv(run: () => void) {
  const previous = isolatePinterestEnv()
  try {
    run()
  } finally {
    restorePinterestEnv(previous)
  }
}

function pinterestMissingToken(eventId: string) {
  return {
    dispatch_mode: 'server_retry' as const,
    event_id: eventId,
    provider: 'pinterest' as const,
    skip_reason: 'missing_capi_token' as const,
    status: 'skipped_unqualified' as const
  }
}

const snapchatEnvKeys = [
  'SNAPCHAT_CONVERSIONS_API_ENABLED',
  'SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN',
  'SNAPCHAT_CONVERSIONS_API_CUTOVER_AT',
  'SNAPCHAT_PIXEL_ID',
  'NEXT_PUBLIC_SNAPCHAT_PIXEL_ID'
] as const

function withSnapchatEnv(
  values: Partial<
    Record<(typeof snapchatEnvKeys)[number], string>
  >,
  run: () => void
) {
  const previous = Object.fromEntries(
    snapchatEnvKeys.map(key => [key, process.env[key]])
  )
  try {
    for (const key of snapchatEnvKeys) delete process.env[key]
    Object.assign(process.env, values)
    run()
  } finally {
    for (const key of snapchatEnvKeys) {
      const value = previous[key]
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

isolatePinterestEnv()

function purchase(
  overrides: Record<string, unknown> = {}
): CanonicalPurchase {
  return canonicalPurchaseSchema.parse({
    schema_version: 1,
    event_name: 'purchase',
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    event_time: '2026-07-24T10:00:00.000Z',
    source: 'webhook',
    environment: 'test',
    browser_id: { ga_client_id: '123456789.1784201643' },
    consent,
    custom_data: {
      currency: 'NOK',
      value: 100,
      transaction_id: 'shopify_order_1',
      order_name: '#1',
      items: [
        {
          item_id: '1',
          item_name: 'Item',
          quantity: 1,
          unit_price: 100
        }
      ]
    },
    ...overrides
  })
}

const purchasePlanningNow = () =>
  Date.parse('2026-07-25T10:00:00.000Z')

function pageView(): CanonicalPageView {
  return canonicalPageViewSchema.parse({
    schema_version: 1,
    event_name: 'page_view',
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    page_view_id: 'e58460a4-5a60-450c-962a-7f22254c25dd',
    event_time: '2026-07-17T10:00:00.000Z',
    source: 'web',
    environment: 'test',
    page_url: 'https://utekos.no/',
    page_title: 'Utekos',
    external_id: 'anon_550e8400-e29b-41d4-a716-446655440000',
    consent
  })
}

function viewItem(): CanonicalViewItem {
  return canonicalViewItemSchema.parse({
    schema_version: 1,
    event_name: 'view_item',
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    page_view_id: 'e58460a4-5a60-450c-962a-7f22254c25dd',
    event_time: '2026-07-17T10:00:00.000Z',
    source: 'web',
    environment: 'test',
    page_url: 'https://utekos.no/produkter/utekos-techdown',
    page_title: 'Utekos TechDown',
    browser_id: { ga_client_id: '123456789.1784201643' },
    consent,
    custom_data: {
      currency: 'NOK',
      gross_value: 1990,
      tax_value: 398,
      value: 1592,
      items: [
        {
          available_for_sale: true,
          collection_ids: [],
          collection_titles: [],
          currently_not_in_stock: false,
          gross_unit_price: 1990,
          item_id: '46944403882232',
          item_name: 'Utekos TechDown',
          price_includes_tax: true,
          product_handle: 'utekos-techdown',
          product_id: 'gid://shopify/Product/1',
          quantity: 1,
          quantity_available: 1,
          selected_options: [],
          tax_amount: 398,
          tax_rate: 0.25,
          taxable: true,
          unit_price: 1592,
          variant_id:
            'gid://shopify/ProductVariant/46944403882232'
        }
      ]
    }
  })
}

test('routes consented page_view events to Meta and Microsoft', () => {
  const previous = process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN
  process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN = 'test-uet-token'

  try {
    assert.deepEqual(planCanonicalEventDispatch(pageView()), [
      {
        dispatch_mode: 'server_retry',
        event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
        provider: 'meta'
      },
      {
        dispatch_mode: 'server_retry',
        event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
        provider: 'microsoft_uet'
      }
    ])
  } finally {
    if (previous === undefined) {
      delete process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN
    } else {
      process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN = previous
    }
  }
})

test('routes view_item only to the active Google and Meta outboxes', () => {
  withIsolatedPinterestEnv(() => {
    assert.deepEqual(planCanonicalEventDispatch(viewItem()), [
      {
        dispatch_mode: 'server_retry',
        event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
        provider: 'google'
      },
      {
        dispatch_mode: 'server_retry',
        event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
        provider: 'meta'
      },
      pinterestMissingToken(
        '61c2ef59-6e6f-4f56-a63a-567ca398f9de'
      )
    ])
  })
})

test('applies provider-specific consent without creating Microsoft rows', () => {
  withIsolatedPinterestEnv(() => {
    const event = viewItem()

    assert.deepEqual(
      planCanonicalEventDispatch({
        ...event,
        consent: {
          ...event.consent,
          analytics: 'granted',
          marketing: 'denied'
        }
      }),
      [
        {
          dispatch_mode: 'server_retry',
          event_id: event.event_id,
          provider: 'google'
        }
      ]
    )

    assert.deepEqual(
      planCanonicalEventDispatch({
        ...event,
        consent: {
          ...event.consent,
          analytics: 'denied',
          marketing: 'granted'
        }
      }),
      [
        {
          dispatch_mode: 'server_retry',
          event_id: event.event_id,
          provider: 'meta'
        },
        pinterestMissingToken(event.event_id)
      ]
    )
  })
})

test('records consented Google events without a valid client ID as unqualified', () => {
  withIsolatedPinterestEnv(() => {
    const event = viewItem()

    assert.deepEqual(
      planCanonicalEventDispatch({
        ...event,
        browser_id: undefined
      }),
      [
        {
          dispatch_mode: 'server_retry',
          event_id: event.event_id,
          provider: 'google',
          skip_reason: 'missing_client_id',
          status: 'skipped_unqualified'
        },
        {
          dispatch_mode: 'server_retry',
          event_id: event.event_id,
          provider: 'meta'
        },
        pinterestMissingToken(event.event_id)
      ]
    )
  })
})

test('routes consented purchase with msclkid and UET token to Microsoft outbox', () => {
  const previous = process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN
  process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN = 'test-uet-token'

  try {
    const event = canonicalPurchaseSchema.parse({
      schema_version: 1,
      event_name: 'purchase',
      event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
      event_time: '2026-07-17T10:05:00.000Z',
      source: 'webhook',
      environment: 'test',
      browser_id: { ga_client_id: '123456789.1784201643' },
      click_id: {
        msclkid: 'dd4afccc-b1c9-4a4c-ad95-44dd7e5006ab'
      },
      consent,
      custom_data: {
        currency: 'NOK',
        value: 100,
        transaction_id: 'shopify_order_1',
        order_name: '#1',
        items: [
          {
            item_id: '1',
            item_name: 'Item',
            quantity: 1,
            unit_price: 100
          }
        ]
      }
    })

    assert.deepEqual(
      planCanonicalEventDispatch(event, {
        now: () => Date.parse('2026-07-17T10:06:00.000Z')
      }),
      [
        {
          dispatch_mode: 'server_retry',
          event_id: event.event_id,
          google_event_freshness: 'within_48h',
          provider: 'google'
        },
        {
          dispatch_mode: 'server_retry',
          event_id: event.event_id,
          provider: 'meta'
        },
        {
          dispatch_mode: 'server_retry',
          event_id: event.event_id,
          provider: 'microsoft_uet'
        },
        pinterestMissingToken(event.event_id)
      ]
    )
  } finally {
    if (previous === undefined) {
      delete process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN
    } else {
      process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN = previous
    }
  }
})

test('skips Microsoft purchase without a supported identifier', () => {
  const previous = process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN
  process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN = 'test-uet-token'

  try {
    const event = canonicalPurchaseSchema.parse({
      schema_version: 1,
      event_name: 'purchase',
      event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
      event_time: '2026-07-17T10:05:00.000Z',
      source: 'webhook',
      environment: 'test',
      browser_id: { ga_client_id: '123456789.1784201643' },
      consent,
      custom_data: {
        currency: 'NOK',
        value: 100,
        transaction_id: 'shopify_order_1',
        order_name: '#1',
        items: [
          {
            item_id: '1',
            item_name: 'Item',
            quantity: 1,
            unit_price: 100
          }
        ]
      }
    })

    const microsoft = planCanonicalEventDispatch(event, {
      now: () => Date.parse('2026-07-17T10:06:00.000Z')
    }).find(intent => intent.provider === 'microsoft_uet')

    assert.deepEqual(microsoft, {
      dispatch_mode: 'server_retry',
      event_id: event.event_id,
      provider: 'microsoft_uet',
      skip_reason: 'missing_microsoft_uet_identifier',
      status: 'skipped_unqualified'
    })
  } finally {
    if (previous === undefined) {
      delete process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN
    } else {
      process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN = previous
    }
  }
})

test('routes Microsoft purchase with external ID when msclkid is absent', () => {
  const previous = process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN
  process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN = 'test-uet-token'

  try {
    const event = purchase({
      external_id: 'anonymous-customer-1'
    })
    const microsoft = planCanonicalEventDispatch(event, {
      now: purchasePlanningNow
    }).find(intent => intent.provider === 'microsoft_uet')

    assert.deepEqual(microsoft, {
      dispatch_mode: 'server_retry',
      event_id: event.event_id,
      provider: 'microsoft_uet'
    })
  } finally {
    if (previous === undefined) {
      delete process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN
    } else {
      process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN = previous
    }
  }
})

test('qualifies purchase for Google with client ID, GCLID, or User-ID separately', () => {
  const cases = [
    purchase(),
    purchase({
      browser_id: undefined,
      click_id: { gclid: 'google-click-id' }
    }),
    purchase({
      browser_id: undefined,
      external_id: 'shopify_customer_1'
    })
  ]

  for (const event of cases) {
    const google = planCanonicalEventDispatch(event, {
      now: purchasePlanningNow
    }).find(intent => intent.provider === 'google')

    assert.deepEqual(google, {
      dispatch_mode: 'server_retry',
      event_id: event.event_id,
      google_event_freshness: 'within_48h',
      provider: 'google'
    })
  }
})

test('does not qualify purchase for Google with userData alone', () => {
  const event = purchase({
    browser_id: undefined,
    user_data: { email_sha256: ['a'.repeat(64)] }
  })

  const google = planCanonicalEventDispatch(event, {
    now: purchasePlanningNow
  }).find(intent => intent.provider === 'google')

  assert.deepEqual(google, {
    dispatch_mode: 'server_retry',
    event_id: event.event_id,
    google_event_freshness: 'within_48h',
    provider: 'google',
    skip_reason: 'missing_google_analytics_identifier',
    status: 'skipped_unqualified'
  })
})

test('does not create a Google purchase dispatch when analytics consent is denied', () => {
  const event = purchase({
    consent: { ...consent, analytics: 'denied' }
  })

  assert.equal(
    planCanonicalEventDispatch(event, {
      now: purchasePlanningNow
    }).find(intent => intent.provider === 'google'),
    undefined
  )
})

test('marks purchase between 48 and 72 hours as late but eligible', () => {
  const event = purchase({
    event_time: '2026-07-22T22:00:00.000Z'
  })

  const google = planCanonicalEventDispatch(event, {
    now: purchasePlanningNow
  }).find(intent => intent.provider === 'google')

  assert.deepEqual(google, {
    dispatch_mode: 'server_retry',
    event_id: event.event_id,
    google_event_freshness: 'late_within_window',
    provider: 'google'
  })
})

test('skips purchase outside the 72-hour Google event window', () => {
  const event = purchase({
    event_time: '2026-07-22T09:59:59.999Z'
  })

  const google = planCanonicalEventDispatch(event, {
    now: purchasePlanningNow
  }).find(intent => intent.provider === 'google')

  assert.deepEqual(google, {
    dispatch_mode: 'server_retry',
    event_id: event.event_id,
    google_event_freshness: 'outside_72h',
    provider: 'google',
    skip_reason: 'google_event_outside_72h',
    status: 'skipped_unqualified'
  })
})

test('itemless refund plans at most one attempt per eligible provider', () => {
  const event = canonicalRefundSchema.parse({
    schema_version: 1,
    event_name: 'refund',
    event_id: '4fe247d5-d8f8-458f-b09f-a8d8511f2644',
    event_time: '2026-07-22T10:00:00.000Z',
    source: 'webhook',
    environment: 'test',
    browser_id: { ga_client_id: '123456789.1784201643' },
    consent,
    custom_data: {
      currency: 'NOK',
      value: 49,
      transaction_id: 'shopify_order_555',
      refund_id: 'shopify_refund_900',
      items: []
    }
  })
  const intents = planCanonicalEventDispatch(event)

  assert.deepEqual(intents, [
    {
      dispatch_mode: 'server_retry',
      event_id: event.event_id,
      provider: 'google'
    }
  ])
  assert.equal(
    new Set(
      intents.map(
        intent => `${intent.provider}:${intent.event_id}`
      )
    ).size,
    intents.length
  )
})

test('routes consented add_to_cart with msclkid and UET token to Microsoft outbox', () => {
  const previous = process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN
  process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN = 'test-uet-token'

  try {
    const event = canonicalAddToCartSchema.parse({
      schema_version: 1,
      event_name: 'add_to_cart',
      event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
      event_time: '2026-07-17T10:05:00.000Z',
      source: 'web',
      environment: 'test',
      page_url: 'https://utekos.no/produkter/utekos-dun',
      page_title: 'Utekos Dun',
      browser_id: { ga_client_id: '123456789.1784201643' },
      click_id: {
        msclkid: 'dd4afccc-b1c9-4a4c-ad95-44dd7e5006ab'
      },
      consent,
      custom_data: {
        currency: 'NOK',
        value: 100,
        gross_value: 100,
        tax_value: 20,
        cart_id: 'cart_1',
        cart_mutation_id: 'mutation_1',
        items: [
          {
            available_for_sale: true,
            collection_ids: [],
            collection_titles: [],
            currently_not_in_stock: false,
            gross_unit_price: 100,
            item_id: '1',
            item_name: 'Item',
            price_includes_tax: true,
            product_handle: 'item',
            product_id: 'gid://shopify/Product/1',
            quantity: 1,
            quantity_available: 1,
            selected_options: [],
            tax_amount: 20,
            tax_rate: 0.25,
            taxable: true,
            unit_price: 100,
            variant_id: 'gid://shopify/ProductVariant/1'
          }
        ]
      }
    })

    assert.deepEqual(planCanonicalEventDispatch(event), [
      {
        dispatch_mode: 'server_retry',
        event_id: event.event_id,
        provider: 'google'
      },
      {
        dispatch_mode: 'server_retry',
        event_id: event.event_id,
        provider: 'meta'
      },
      {
        dispatch_mode: 'server_retry',
        event_id: event.event_id,
        provider: 'microsoft_uet'
      },
      pinterestMissingToken(event.event_id)
    ])
  } finally {
    if (previous === undefined) {
      delete process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN
    } else {
      process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN = previous
    }
  }
})

test('skips Microsoft add_to_cart without a supported identifier', () => {
  const previous = process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN
  process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN = 'test-uet-token'

  try {
    const event = canonicalAddToCartSchema.parse({
      schema_version: 1,
      event_name: 'add_to_cart',
      event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
      event_time: '2026-07-17T10:05:00.000Z',
      source: 'web',
      environment: 'test',
      page_url: 'https://utekos.no/produkter/utekos-dun',
      page_title: 'Utekos Dun',
      browser_id: { ga_client_id: '123456789.1784201643' },
      consent,
      custom_data: {
        currency: 'NOK',
        value: 100,
        gross_value: 100,
        tax_value: 20,
        cart_id: 'cart_1',
        cart_mutation_id: 'mutation_1',
        items: [
          {
            available_for_sale: true,
            collection_ids: [],
            collection_titles: [],
            currently_not_in_stock: false,
            gross_unit_price: 100,
            item_id: '1',
            item_name: 'Item',
            price_includes_tax: true,
            product_handle: 'item',
            product_id: 'gid://shopify/Product/1',
            quantity: 1,
            quantity_available: 1,
            selected_options: [],
            tax_amount: 20,
            tax_rate: 0.25,
            taxable: true,
            unit_price: 100,
            variant_id: 'gid://shopify/ProductVariant/1'
          }
        ]
      }
    })

    const microsoft = planCanonicalEventDispatch(event).find(
      intent => intent.provider === 'microsoft_uet'
    )

    assert.deepEqual(microsoft, {
      dispatch_mode: 'server_retry',
      event_id: event.event_id,
      provider: 'microsoft_uet',
      skip_reason: 'missing_microsoft_uet_identifier',
      status: 'skipped_unqualified'
    })
  } finally {
    if (previous === undefined) {
      delete process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN
    } else {
      process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN = previous
    }
  }
})

test('routes consented begin_checkout with msclkid and UET token to Microsoft outbox', () => {
  const previous = process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN
  process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN = 'test-uet-token'

  try {
    const event = canonicalBeginCheckoutSchema.parse({
      schema_version: 1,
      event_name: 'begin_checkout',
      event_id: '71c2ef59-6e6f-4f56-a63a-567ca398f9de',
      event_time: '2026-07-17T10:10:00.000Z',
      source: 'web',
      environment: 'test',
      page_url: 'https://utekos.no/checkout',
      page_title: 'Checkout',
      browser_id: { ga_client_id: '123456789.1784201643' },
      click_id: {
        msclkid: 'dd4afccc-b1c9-4a4c-ad95-44dd7e5006ab'
      },
      consent,
      custom_data: {
        currency: 'NOK',
        value: 100,
        gross_value: 100,
        tax_value: 20,
        cart_id: 'cart_1',
        checkout_id: 'checkout_1',
        creation_revision: '1',
        items: [
          {
            available_for_sale: true,
            collection_ids: [],
            collection_titles: [],
            currently_not_in_stock: false,
            gross_unit_price: 100,
            item_id: '1',
            item_name: 'Item',
            price_includes_tax: true,
            product_handle: 'item',
            product_id: 'gid://shopify/Product/1',
            quantity: 1,
            quantity_available: 1,
            selected_options: [],
            tax_amount: 20,
            tax_rate: 0.25,
            taxable: true,
            unit_price: 100,
            variant_id: 'gid://shopify/ProductVariant/1'
          }
        ]
      }
    })

    assert.deepEqual(planCanonicalEventDispatch(event), [
      {
        dispatch_mode: 'server_retry',
        event_id: event.event_id,
        provider: 'google'
      },
      {
        dispatch_mode: 'server_retry',
        event_id: event.event_id,
        provider: 'meta'
      },
      {
        dispatch_mode: 'server_retry',
        event_id: event.event_id,
        provider: 'microsoft_uet'
      },
      pinterestMissingToken(event.event_id)
    ])
  } finally {
    if (previous === undefined) {
      delete process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN
    } else {
      process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN = previous
    }
  }
})

test('skips Microsoft begin_checkout without a supported identifier', () => {
  const previous = process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN
  process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN = 'test-uet-token'

  try {
    const event = canonicalBeginCheckoutSchema.parse({
      schema_version: 1,
      event_name: 'begin_checkout',
      event_id: '71c2ef59-6e6f-4f56-a63a-567ca398f9de',
      event_time: '2026-07-17T10:10:00.000Z',
      source: 'web',
      environment: 'test',
      page_url: 'https://utekos.no/checkout',
      page_title: 'Checkout',
      browser_id: { ga_client_id: '123456789.1784201643' },
      consent,
      custom_data: {
        currency: 'NOK',
        value: 100,
        gross_value: 100,
        tax_value: 20,
        cart_id: 'cart_1',
        checkout_id: 'checkout_1',
        creation_revision: '1',
        items: [
          {
            available_for_sale: true,
            collection_ids: [],
            collection_titles: [],
            currently_not_in_stock: false,
            gross_unit_price: 100,
            item_id: '1',
            item_name: 'Item',
            price_includes_tax: true,
            product_handle: 'item',
            product_id: 'gid://shopify/Product/1',
            quantity: 1,
            quantity_available: 1,
            selected_options: [],
            tax_amount: 20,
            tax_rate: 0.25,
            taxable: true,
            unit_price: 100,
            variant_id: 'gid://shopify/ProductVariant/1'
          }
        ]
      }
    })

    const microsoft = planCanonicalEventDispatch(event).find(
      intent => intent.provider === 'microsoft_uet'
    )

    assert.deepEqual(microsoft, {
      dispatch_mode: 'server_retry',
      event_id: event.event_id,
      provider: 'microsoft_uet',
      skip_reason: 'missing_microsoft_uet_identifier',
      status: 'skipped_unqualified'
    })
  } finally {
    if (previous === undefined) {
      delete process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN
    } else {
      process.env.MICROSOFT_UET_CAPI_ACCESS_TOKEN = previous
    }
  }
})

test('skips Pinterest view_item when CAPI is not configured', () => {
  withIsolatedPinterestEnv(() => {
    const pinterest = planCanonicalEventDispatch(
      viewItem()
    ).find(intent => intent.provider === 'pinterest')

    assert.deepEqual(
      pinterest,
      pinterestMissingToken(
        '61c2ef59-6e6f-4f56-a63a-567ca398f9de'
      )
    )
  })
})

test('skips Pinterest view_item without a user identity', () => {
  withIsolatedPinterestEnv(() => {
    process.env.PINTEREST_CONVERSIONS_API_ENABLED = 'true'
    process.env.PINTEREST_CONVERSIONS_ACCESS_TOKEN = 'test-token'
    process.env.PINTEREST_AD_ACCOUNT_ID = '123456789'

    const pinterest = planCanonicalEventDispatch(
      viewItem()
    ).find(intent => intent.provider === 'pinterest')

    assert.deepEqual(pinterest, {
      dispatch_mode: 'server_retry',
      event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
      provider: 'pinterest',
      skip_reason: 'insufficient_pinterest_user_identity',
      status: 'skipped_unqualified'
    })
  })
})

test('enqueues Pinterest view_item when CAPI is configured and IP plus UA are present', () => {
  withIsolatedPinterestEnv(() => {
    process.env.PINTEREST_CONVERSIONS_API_ENABLED = 'true'
    process.env.PINTEREST_CONVERSIONS_ACCESS_TOKEN = 'test-token'
    process.env.PINTEREST_AD_ACCOUNT_ID = '123456789'

    const event = {
      ...viewItem(),
      client_ip_address: '203.0.113.10',
      event_device_info: { user_agent: 'Mozilla/5.0 UtekosTest' }
    }

    const pinterest = planCanonicalEventDispatch(event).find(
      intent => intent.provider === 'pinterest'
    )

    assert.deepEqual(pinterest, {
      dispatch_mode: 'server_retry',
      event_id: event.event_id,
      provider: 'pinterest'
    })
  })
})

test('enqueues Pinterest purchase when CAPI is configured and email hash is present', () => {
  withIsolatedPinterestEnv(() => {
    process.env.PINTEREST_CONVERSIONS_API_ENABLED = 'true'
    process.env.PINTEREST_CONVERSIONS_ACCESS_TOKEN = 'test-token'
    process.env.PINTEREST_AD_ACCOUNT_ID = '123456789'

    const event = purchase({
      user_data: { email_sha256: ['a'.repeat(64)] }
    })
    const pinterest = planCanonicalEventDispatch(event, {
      now: purchasePlanningNow
    }).find(intent => intent.provider === 'pinterest')

    assert.deepEqual(pinterest, {
      dispatch_mode: 'server_retry',
      event_id: event.event_id,
      provider: 'pinterest'
    })
  })
})

test('does not plan Snapchat rows while its feature flag is disabled', () => {
  withSnapchatEnv({}, () => {
    const snapchat = planCanonicalEventDispatch(viewItem()).find(
      intent => intent.provider === 'snapchat'
    )
    assert.equal(snapchat, undefined)
  })
})

test('classifies Snapchat configuration, identity, freshness, and cutover gates', () => {
  const now = Date.parse('2026-08-23T10:00:00.000Z')
  const base = {
    SNAPCHAT_CONVERSIONS_API_ENABLED: 'true',
    SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN: 'test-token',
    SNAPCHAT_CONVERSIONS_API_CUTOVER_AT:
      '2026-08-23T09:00:00.000Z',
    SNAPCHAT_PIXEL_ID: 'pixel-a',
    NEXT_PUBLIC_SNAPCHAT_PIXEL_ID: 'pixel-a'
  }

  withSnapchatEnv(
    { ...base, NEXT_PUBLIC_SNAPCHAT_PIXEL_ID: 'pixel-b' },
    () => {
      const event = {
        ...viewItem(),
        event_time: '2026-08-23T09:30:00.000Z'
      }
      const snapchat = planCanonicalEventDispatch(event, {
        now: () => now
      }).find(intent => intent.provider === 'snapchat')
      assert.equal(
        snapchat && 'skip_reason' in snapchat ?
          snapchat.skip_reason
        : undefined,
        'missing_snapchat_configuration'
      )
    }
  )

  withSnapchatEnv(base, () => {
    const event = {
      ...viewItem(),
      event_time: '2026-08-23T09:30:00.000Z'
    }
    const snapchat = planCanonicalEventDispatch(event, {
      now: () => now
    }).find(intent => intent.provider === 'snapchat')
    assert.equal(
      snapchat && 'skip_reason' in snapchat ?
        snapchat.skip_reason
      : undefined,
      'missing_snapchat_match_identifier'
    )
  })

  withSnapchatEnv(base, () => {
    const event = {
      ...viewItem(),
      event_time: '2026-08-15T09:30:00.000Z',
      client_ip_address: '192.0.2.1',
      event_device_info: { user_agent: 'test' }
    }
    const snapchat = planCanonicalEventDispatch(event, {
      now: () => now
    }).find(intent => intent.provider === 'snapchat')
    assert.equal(
      snapchat && 'skip_reason' in snapchat ?
        snapchat.skip_reason
      : undefined,
      'snapchat_event_outside_7d'
    )
  })

  withSnapchatEnv(base, () => {
    const event = {
      ...viewItem(),
      event_time: '2026-08-23T08:30:00.000Z',
      client_ip_address: '192.0.2.1',
      event_device_info: { user_agent: 'test' }
    }
    const snapchat = planCanonicalEventDispatch(event, {
      now: () => now
    }).find(intent => intent.provider === 'snapchat')
    assert.equal(
      snapchat && 'skip_reason' in snapchat ?
        snapchat.skip_reason
      : undefined,
      'snapchat_before_cutover'
    )
  })
})

test('plans Snapchat CAPI v3 for a qualified post-cutover event', () => {
  const now = Date.parse('2026-08-23T10:00:00.000Z')
  withSnapchatEnv(
    {
      SNAPCHAT_CONVERSIONS_API_ENABLED: 'true',
      SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN: 'test-token',
      SNAPCHAT_CONVERSIONS_API_CUTOVER_AT:
        '2026-08-23T09:00:00.000Z',
      SNAPCHAT_PIXEL_ID: 'pixel-a',
      NEXT_PUBLIC_SNAPCHAT_PIXEL_ID: 'pixel-a'
    },
    () => {
      const event = {
        ...viewItem(),
        event_time: '2026-08-23T09:30:00.000Z',
        client_ip_address: '192.0.2.1',
        event_device_info: { user_agent: 'test' }
      }
      const snapchat = planCanonicalEventDispatch(event, {
        now: () => now
      }).find(intent => intent.provider === 'snapchat')

      assert.deepEqual(snapchat, {
        dispatch_mode: 'server_retry',
        event_id: event.event_id,
        provider: 'snapchat',
        snapchat_event_freshness: 'within_7d'
      })
    }
  )
})
