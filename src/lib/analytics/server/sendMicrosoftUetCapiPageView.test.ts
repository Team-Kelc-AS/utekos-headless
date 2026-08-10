import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalPageViewSchema } from '../pageViewEvent'
import { sendMicrosoftUetCapiPageView } from './sendMicrosoftUetCapiPageView'

function pageView() {
  return canonicalPageViewSchema.parse({
    schema_version: 1,
    event_name: 'page_view',
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    page_view_id: '71c2ef59-6e6f-4f56-a63a-567ca398f9de',
    event_time: '2026-08-10T10:05:00.000Z',
    source: 'web',
    environment: 'test',
    page_url: 'https://utekos.no/produkter/utekos-dun',
    page_title: 'Utekos Dun',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    external_id:
      'anon_550e8400-e29b-41d4-a716-446655440000'
  })
}

test('posts pageLoad events to the direct Microsoft UET endpoint', async () => {
  const calls: Array<{ body: string; url: string }> = []
  const result = await sendMicrosoftUetCapiPageView(pageView(), {
    fetchFn: async (url, init) => {
      calls.push({ body: String(init.body), url })
      return {
        headers: new Headers({ 'x-ms-request-id': 'req-page-1' }),
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ eventsReceived: 1 })
      }
    },
    readConfig: () => ({ apiToken: 'uet-token', tagId: '97247724' }),
    resolveToken: () => 'uet-token'
  })

  assert.equal(
    calls[0]?.url,
    'https://capi.uet.microsoft.com/v1/97247724/events'
  )
  assert.match(calls[0]?.body ?? '', /"eventType":"pageLoad"/)
  assert.equal(result.eventName, 'page_view')
  assert.equal(result.eventsReceived, 1)
  assert.equal(result.requestId, 'req-page-1')
})
