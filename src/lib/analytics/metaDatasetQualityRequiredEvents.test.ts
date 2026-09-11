import assert from 'node:assert/strict'
import test from 'node:test'
import { eventCatalog } from './eventCatalog'
import { requiredMetaDatasetQualityEvents } from './metaDatasetQualityRequiredEvents'

const expectedMetaDatasetQualityEvents = [
  'LandingScrollDepth',
  'PageView',
  'ViewContent',
  'ViewItemList',
  'ViewCart',
  'InteractWithAccordion',
  'AddToCart',
  'ViewCategory',
  'InitiateCheckout',
  'SelectItem',
  'HeroInteract',
  'RemoveFromCart',
  'Purchase',
  'AddToWishlist',
  'OpenQuickView',
  'AddPaymentInfo',
  'AddShippingInfo',
  'Lead'
] as const

test('monitors the complete operator-approved Meta event set', () => {
  assert.deepEqual(
    requiredMetaDatasetQualityEvents,
    expectedMetaDatasetQualityEvents
  )
})

test('keeps every required Meta event backed by an active server mapping', () => {
  const activeMetaServerEvents = new Set(
    Object.values(eventCatalog)
      .filter(entry => entry.lifecycle === 'active')
      .filter(
        entry =>
          entry.providers.meta.transport.server ===
            'meta_conversions_api' &&
          entry.providers.meta.serverOutbox === 'active'
      )
      .map(entry => entry.providers.meta.eventName)
      .filter(
        (eventName): eventName is string => eventName !== null
      )
  )

  for (const eventName of requiredMetaDatasetQualityEvents) {
    assert.equal(
      activeMetaServerEvents.has(eventName),
      true,
      `${eventName} must have an active Meta CAPI mapping`
    )
  }
})
