import assert from 'node:assert/strict'
import test from 'node:test'
import { acceptCanonicalViewCategory } from './acceptCanonicalViewCategory'
import { createCanonicalViewCategory } from '../viewCategoryEvent'
import type { CanonicalEventStore } from './canonicalEventStore'

const event = createCanonicalViewCategory({
  environment: 'test',
  eventId: '72b6c4d3-cf47-493b-844c-147e237fcf45',
  eventTime: '2026-07-24T00:00:00.000Z',
  pageUrl: 'https://utekos.no/produkter',
  pageTitle: 'Kolleksjonen',
  pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
  consent: {
    analytics: 'granted',
    marketing: 'granted',
    preferences: 'denied',
    source: 'cookiebot',
    version: '1'
  },
  customData: {
    category_id: 'produkter',
    category_name: 'Kolleksjonen',
    view_sequence: 1,
    content_ids: ['48249962135800']
  }
})

test('flushes Meta before returning accepted', async () => {
  const flushed: string[] = []
  const store: CanonicalEventStore = {
    accept: async () => ({
      createdDispatchAttempts: [
        {
          adapterKey: 'meta:view_category',
          attemptId: '22222222-2222-4222-8222-222222222222'
        }
      ],
      status: 'inserted'
    })
  }

  const result = await acceptCanonicalViewCategory({
    payload: event,
    requestContext: {},
    store,
    flushMetaDispatch: async attempts => {
      flushed.push(...attempts.map(attempt => attempt.adapterKey))
    }
  })

  assert.deepEqual(result, {
    event_id: event.event_id,
    status: 'accepted'
  })
  assert.deepEqual(flushed, ['meta:view_category'])
})
