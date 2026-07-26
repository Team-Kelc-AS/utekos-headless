import assert from 'node:assert/strict'
import test from 'node:test'
import type { ReportCanonicalViewItemListInput } from './viewItemListReporter'
import {
  createCanonicalProductListVisibilityTracker,
  PRODUCT_LIST_FLUSH_DELAY_MS,
  PRODUCT_LIST_VISIBILITY_DURATION_MS,
  type ProductListVisibilityEntry,
  type ProductListVisibilityRegistration
} from './productListVisibilityTracker'
import type { ShopifyProduct } from 'types/product/ShopifyProduct'
import type { ShopifyProductVariant } from 'types/product/ShopifyProductVariant'

type ScheduledTimer = {
  callback: () => void
  cancelled: boolean
  delayMs: number
  handle: ReturnType<typeof setTimeout>
}

function product(index: number): ShopifyProduct {
  return {
    id: `gid://shopify/Product/${index}`,
    handle: `product-${index}`,
    title: `Product ${index}`,
    vendor: 'Utekos',
    productType: 'Yttertøy',
    collections: { nodes: [] },
    options: [],
    variants: { nodes: [] },
    featuredImage: null,
    priceRange: {
      minVariantPrice: { amount: '100.00', currencyCode: 'NOK' },
      maxVariantPrice: { amount: '100.00', currencyCode: 'NOK' }
    }
  } as unknown as ShopifyProduct
}

function variant(index: number): ShopifyProductVariant {
  return {
    id: `gid://shopify/ProductVariant/${index}`,
    title: 'Default',
    availableForSale: true,
    currentlyNotInStock: false,
    quantityAvailable: 5,
    selectedOptions: [],
    price: { amount: '100.00', currencyCode: 'NOK' },
    compareAtPrice: null,
    image: null,
    sku: `SKU-${index}`,
    taxable: true
  } as unknown as ShopifyProductVariant
}

function harness() {
  const reports: ReportCanonicalViewItemListInput[] = []
  const timers: ScheduledTimer[] = []
  let emit: (
    entries: readonly ProductListVisibilityEntry[]
  ) => void = () => {}
  let pageViewId = 'e58460a4-5a60-450c-962a-7f22254c25dd'

  const tracker = createCanonicalProductListVisibilityTracker({
    clearTimer: handle => {
      const timer = timers.find(current => current.handle === handle)
      if (timer) timer.cancelled = true
    },
    createObserver: callback => {
      emit = callback
      return { observe: () => {}, unobserve: () => {} }
    },
    getPageViewId: () => pageViewId,
    report: input => {
      reports.push(input)
      return () => {}
    },
    setTimer: (callback, delayMs) => {
      const handle = {} as ReturnType<typeof setTimeout>
      timers.push({ callback, cancelled: false, delayMs, handle })
      return handle
    }
  })

  function runTimers(delayMs: number) {
    for (const timer of timers.filter(
      current =>
        current.delayMs === delayMs && !current.cancelled
    )) {
      timer.cancelled = true
      timer.callback()
    }
  }

  return {
    emit: (entries: readonly ProductListVisibilityEntry[]) =>
      emit(entries),
    reports,
    runTimers,
    setPageViewId: (value: string) => {
      pageViewId = value
    },
    tracker
  }
}

function registration(
  index: number,
  element: Element,
  totalItemCount = 1
): ProductListVisibilityRegistration {
  return {
    element,
    itemListId: 'featured_products',
    itemListName: 'Utvalgte produkter',
    product: product(index),
    totalItemCount,
    variant: variant(index)
  }
}

function entry(
  target: Element,
  intersectionRatio: number
): ProductListVisibilityEntry {
  return {
    intersectionRatio,
    isIntersecting: intersectionRatio > 0,
    target
  }
}

test('requires 50 percent continuous visibility for one second', () => {
  const testHarness = harness()
  const element = {} as Element
  testHarness.tracker.register(registration(1, element))

  testHarness.emit([entry(element, 0.49)])
  testHarness.runTimers(PRODUCT_LIST_VISIBILITY_DURATION_MS)
  assert.equal(testHarness.reports.length, 0)

  testHarness.emit([entry(element, 0.5)])
  testHarness.emit([entry(element, 0.49)])
  testHarness.runTimers(PRODUCT_LIST_VISIBILITY_DURATION_MS)
  testHarness.runTimers(PRODUCT_LIST_FLUSH_DELAY_MS)
  assert.equal(testHarness.reports.length, 0)

  testHarness.emit([entry(element, 0.5)])
  testHarness.runTimers(PRODUCT_LIST_VISIBILITY_DURATION_MS)
  testHarness.runTimers(PRODUCT_LIST_FLUSH_DELAY_MS)
  assert.equal(testHarness.reports.length, 1)
})

test('does not report the same variant again on re-entry in one page view', () => {
  const testHarness = harness()
  const element = {} as Element
  testHarness.tracker.register(registration(1, element))

  testHarness.emit([entry(element, 0.5)])
  testHarness.runTimers(PRODUCT_LIST_VISIBILITY_DURATION_MS)
  testHarness.runTimers(PRODUCT_LIST_FLUSH_DELAY_MS)
  testHarness.emit([entry(element, 0)])
  testHarness.emit([entry(element, 0.8)])
  testHarness.runTimers(PRODUCT_LIST_VISIBILITY_DURATION_MS)
  testHarness.runTimers(PRODUCT_LIST_FLUSH_DELAY_MS)

  assert.equal(testHarness.reports.length, 1)
  assert.equal(
    testHarness.reports[0]?.customData.impression_sequence,
    1
  )
})

test('chunks 21 newly visible products into 20 and 1 with new sequences', () => {
  const testHarness = harness()
  const elements = Array.from(
    { length: 21 },
    () => ({}) as Element
  )

  elements.forEach((element, index) => {
    testHarness.tracker.register(
      registration(index + 1, element, elements.length)
    )
  })
  testHarness.emit(elements.map(element => entry(element, 0.75)))
  testHarness.runTimers(PRODUCT_LIST_VISIBILITY_DURATION_MS)
  testHarness.runTimers(PRODUCT_LIST_FLUSH_DELAY_MS)

  assert.equal(testHarness.reports.length, 2)
  assert.deepEqual(
    testHarness.reports.map(report => report.customData.items.length),
    [20, 1]
  )
  assert.deepEqual(
    testHarness.reports.map(
      report => report.customData.impression_sequence
    ),
    [1, 2]
  )
  assert.equal(
    testHarness.reports[0]?.customData.total_item_count,
    21
  )
  assert.equal(testHarness.reports[0]?.customData.currency, 'NOK')
  assert.equal(testHarness.reports[0]?.customData.gross_value, 2_000)
})

test('starts dedupe and impression sequence again for a new page view', () => {
  const testHarness = harness()
  const element = {} as Element
  testHarness.tracker.register(registration(1, element))

  testHarness.emit([entry(element, 0.5)])
  testHarness.runTimers(PRODUCT_LIST_VISIBILITY_DURATION_MS)
  testHarness.runTimers(PRODUCT_LIST_FLUSH_DELAY_MS)

  testHarness.setPageViewId(
    '04d31dbe-163b-45bf-a8f3-24d58ee801fe'
  )
  testHarness.emit([entry(element, 0)])
  testHarness.emit([entry(element, 0.5)])
  testHarness.runTimers(PRODUCT_LIST_VISIBILITY_DURATION_MS)
  testHarness.runTimers(PRODUCT_LIST_FLUSH_DELAY_MS)

  assert.equal(testHarness.reports.length, 2)
  assert.equal(
    testHarness.reports[1]?.customData.impression_sequence,
    1
  )
  assert.equal(
    testHarness.reports[1]?.pageViewId,
    '04d31dbe-163b-45bf-a8f3-24d58ee801fe'
  )
})
