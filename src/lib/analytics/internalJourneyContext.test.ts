import assert from 'node:assert/strict'
import test from 'node:test'
import { createInternalJourneyContextEnricher } from './internalJourneyContext'

const grantedConsent = {
  analytics: 'granted' as const,
  marketing: 'denied' as const,
  preferences: 'denied' as const,
  source: 'cookiebot' as const,
  version: '1'
}

function createStorage(initialValue?: string) {
  const values = new Map<string, string>()

  if (initialValue) {
    values.set('utekos:analytics:journey:v1', initialValue)
  }

  return {
    getItem(key: string) {
      return values.get(key) ?? null
    },
    removeItem(key: string) {
      values.delete(key)
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
    values
  }
}

test('creates one analytics-consented journey per session and links the preceding page view', () => {
  const journeyId = '11111111-1111-4111-8111-111111111111'
  const previousPageViewId =
    '22222222-2222-4222-8222-222222222222'
  const pageViewId = '33333333-3333-4333-8333-333333333333'
  const storage = createStorage()
  let creates = 0
  const enrich = createInternalJourneyContextEnricher({
    createId: () => {
      creates += 1
      return journeyId
    },
    getPreviousPageViewId: candidate =>
      candidate === pageViewId ? previousPageViewId : undefined,
    getStorage: () => storage
  })

  const first = enrich({
    consent: grantedConsent,
    page_view_id: pageViewId
  })
  const repeated = enrich({
    consent: grantedConsent,
    page_view_id: pageViewId
  })

  assert.equal(first.journey_id, journeyId)
  assert.equal(
    first.previous_page_view_id,
    previousPageViewId
  )
  assert.equal(repeated.journey_id, journeyId)
  assert.equal(creates, 1)
  assert.equal(
    storage.values.get('utekos:analytics:journey:v1'),
    journeyId
  )
})

test('does not create or retain journey identifiers without analytics consent', () => {
  const journeyId = '11111111-1111-4111-8111-111111111111'
  const storage = createStorage(journeyId)
  let creates = 0
  const enrich = createInternalJourneyContextEnricher({
    createId: () => {
      creates += 1
      return journeyId
    },
    getPreviousPageViewId: () =>
      '22222222-2222-4222-8222-222222222222',
    getStorage: () => storage
  })

  const denied = enrich({
    consent: {
      ...grantedConsent,
      analytics: 'denied' as const
    },
    journey_id: journeyId,
    previous_page_view_id:
      '22222222-2222-4222-8222-222222222222'
  })

  assert.equal(denied.journey_id, undefined)
  assert.equal(denied.previous_page_view_id, undefined)
  assert.equal(creates, 0)
  assert.equal(storage.values.size, 0)
})

test('reuses a valid session journey without generating a replacement', () => {
  const journeyId = '11111111-1111-4111-8111-111111111111'
  const storage = createStorage(journeyId)
  const enrich = createInternalJourneyContextEnricher({
    createId: () => {
      throw new Error('must not create a replacement journey')
    },
    getPreviousPageViewId: () => undefined,
    getStorage: () => storage
  })

  assert.equal(
    enrich({ consent: grantedConsent }).journey_id,
    journeyId
  )
})
