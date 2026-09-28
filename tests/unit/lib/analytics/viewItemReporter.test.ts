import assert from 'node:assert/strict'
import test from 'node:test'
import { createPageViewSession } from '@/lib/analytics/pageViewSession'
import {
  createCanonicalViewItem,
  type CanonicalViewItem
} from '@/lib/analytics/viewItemEvent'
import {
  createViewItemReporter,
  resolveTrackingEnvironment
} from '@/lib/analytics/viewItemReporter'
import type { ShopifyProduct } from 'types/product/ShopifyProduct'
import type { ShopifyProductVariant } from 'types/product/ShopifyProductVariant'

const product = {
  id: 'gid://shopify/Product/456'
} as ShopifyProduct

const variant = {
  id: 'gid://shopify/ProductVariant/123'
} as ShopifyProductVariant

const commerce = {
  currency: 'NOK',
  value: 100,
  gross_value: 125,
  tax_value: 25,
  items: [
    {
      item_id: variant.id,
      product_id: product.id,
      variant_id: variant.id,
      item_name: 'Utekos Techdown',
      product_handle: 'utekos-techdown',
      quantity: 1,
      unit_price: 100,
      gross_unit_price: 125,
      tax_amount: 25,
      tax_rate: 0.25,
      taxable: true,
      price_includes_tax: true,
      available_for_sale: true,
      currently_not_in_stock: false,
      quantity_available: 8,
      selected_options: [],
      collection_ids: [],
      collection_titles: []
    }
  ]
}

const clientContext = {
  pageUrl: 'https://utekos.no/produkter/utekos-techdown',
  documentReferrer: 'https://utekos.no/produkter',
  pageTitle: 'Utekos Techdown | Utekos',
  environment: 'production' as const,
  consent: {
    analytics: 'granted' as const,
    marketing: 'denied' as const,
    preferences: 'denied' as const,
    source: 'cookiebot' as const,
    version: '1'
  }
}

test('waits for page_view and emits view_item with the actual page_view_id', () => {
  const session = createPageViewSession(
    () => '0c955d6b-5e9c-47d0-b304-046df7f4bf7f'
  )

  const emitted: CanonicalViewItem[] = []

  let completed = 0

  const report = createViewItemReporter({
    pageViewSession: session,
    readClientContext: () => clientContext,
    mapCommerce: () => commerce,
    createEvent: createCanonicalViewItem,
    createEventId: () => '72b6c4d3-cf47-493b-844c-147e237fcf45',
    getEventTime: () => '2026-07-15T12:34:57.000Z',
    emitEvent: event => {
      emitted.push(event)
    },
    reportError: error => {
      throw error
    }
  })

  report({
    product,
    variant,
    onEmitted: () => {
      completed += 1
    }
  })

  assert.equal(emitted.length, 0)

  session.recordEmitted({
    pageUrl: clientContext.pageUrl,
    pageViewId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7',
    referrerUrl: clientContext.documentReferrer
  })

  assert.equal(emitted.length, 1)

  assert.equal(
    emitted[0]?.page_view_id,
    'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7'
  )

  assert.equal(
    emitted[0]?.custom_data.items[0]?.variant_id,
    variant.id
  )

  assert.equal(completed, 1)
})

test('follows product query normalization on the same page resource', () => {
  const session = createPageViewSession(
    () => '0c955d6b-5e9c-47d0-b304-046df7f4bf7f'
  )
  const initialPageUrl =
    'https://utekos.no/produkter/utekos-techdown?fbclid=click-1'
  const normalizedPageUrl = `${initialPageUrl}&farge=havdyp&storrelse=middels`
  let currentContext = {
    ...clientContext,
    pageUrl: initialPageUrl
  }
  const emitted: CanonicalViewItem[] = []
  const report = createViewItemReporter({
    pageViewSession: session,
    readClientContext: () => currentContext,
    mapCommerce: () => commerce,
    createEvent: createCanonicalViewItem,
    createEventId: () => '72b6c4d3-cf47-493b-844c-147e237fcf45',
    getEventTime: () => '2026-07-15T12:34:57.000Z',
    emitEvent: event => {
      emitted.push(event)
    },
    reportError: error => {
      throw error
    }
  })

  report({ product, variant })
  currentContext = {
    ...currentContext,
    pageUrl: normalizedPageUrl
  }
  session.recordEmitted({
    pageUrl: normalizedPageUrl,
    pageViewId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7'
  })

  assert.equal(emitted.length, 1)
  assert.equal(emitted[0]?.page_url, normalizedPageUrl)
})

test('does not attach a product report to another page resource', () => {
  const session = createPageViewSession(
    () => '0c955d6b-5e9c-47d0-b304-046df7f4bf7f'
  )
  let currentContext = clientContext
  const emitted: CanonicalViewItem[] = []
  const report = createViewItemReporter({
    pageViewSession: session,
    readClientContext: () => currentContext,
    mapCommerce: () => commerce,
    createEvent: createCanonicalViewItem,
    createEventId: () => '72b6c4d3-cf47-493b-844c-147e237fcf45',
    getEventTime: () => '2026-07-15T12:34:57.000Z',
    emitEvent: event => {
      emitted.push(event)
    },
    reportError: error => {
      throw error
    }
  })

  report({ product, variant })
  currentContext = {
    ...clientContext,
    pageUrl: 'https://utekos.no/produkter/comfyrobe'
  }
  session.recordEmitted({
    pageUrl: currentContext.pageUrl,
    pageViewId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7'
  })

  assert.equal(emitted.length, 0)
})

test('cancels a stale product report before page_view is emitted', () => {
  const session = createPageViewSession(
    () => '0c955d6b-5e9c-47d0-b304-046df7f4bf7f'
  )

  const emitted: CanonicalViewItem[] = []

  const report = createViewItemReporter({
    pageViewSession: session,
    readClientContext: () => clientContext,
    mapCommerce: () => commerce,
    createEvent: createCanonicalViewItem,
    createEventId: () => '72b6c4d3-cf47-493b-844c-147e237fcf45',
    getEventTime: () => '2026-07-15T12:34:57.000Z',
    emitEvent: event => {
      emitted.push(event)
    },
    reportError: error => {
      throw error
    }
  })

  const cancel = report({ product, variant })

  cancel()

  session.recordEmitted({
    pageUrl: clientContext.pageUrl,
    pageViewId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7'
  })

  assert.equal(emitted.length, 0)
})

test('keeps an emitted collector alive when the product effect is cleaned up', () => {
  const session = createPageViewSession(
    () => '0c955d6b-5e9c-47d0-b304-046df7f4bf7f'
  )
  let collectorStopped = 0

  session.recordEmitted({
    pageUrl: clientContext.pageUrl,
    pageViewId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7'
  })

  const report = createViewItemReporter({
    pageViewSession: session,
    readClientContext: () => clientContext,
    mapCommerce: () => commerce,
    createEvent: createCanonicalViewItem,
    createEventId: () => '72b6c4d3-cf47-493b-844c-147e237fcf45',
    getEventTime: () => '2026-07-15T12:34:57.000Z',
    emitEvent: () => () => {
      collectorStopped += 1
    },
    reportError: error => {
      throw error
    }
  })

  const stop = report({ product, variant })
  stop()

  assert.equal(collectorStopped, 0)
})

test('resolves development, preview, production and test environments', () => {
  assert.equal(
    resolveTrackingEnvironment(
      'http://localhost:3000',
      'development'
    ),
    'development'
  )

  assert.equal(
    resolveTrackingEnvironment(
      'http://localhost:3000',
      'production'
    ),
    'development'
  )

  assert.equal(
    resolveTrackingEnvironment(
      'https://utekos.no',
      'production'
    ),
    'production'
  )

  assert.equal(
    resolveTrackingEnvironment(
      'https://utekos-headless-git-test.vercel.app',
      'production'
    ),
    'preview'
  )

  assert.equal(
    resolveTrackingEnvironment('https://utekos.no', 'test'),
    'test'
  )
})
