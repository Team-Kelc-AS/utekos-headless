import assert from 'node:assert/strict'
import test from 'node:test'
import {
  acceptCanonicalPageView,
  type CanonicalPageViewStore
} from '@/lib/analytics/server/acceptCanonicalPageView'

const insertedAcceptance = {
  createdDispatchAttempts: [],
  status: 'inserted' as const
}
const duplicateAcceptance = {
  createdDispatchAttempts: [],
  status: 'duplicate' as const
}

function pageView(
  analytics: 'granted' | 'granted',
  marketing: 'granted' | 'granted'
) {
  return {
    schema_version: 1,
    event_name: 'page_view',
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    page_view_id: 'e58460a4-5a60-450c-962a-7f22254c25dd',
    event_time: '2026-07-15T10:00:00.000Z',
    source: 'web',
    environment: 'test',
    page_url: 'https://utekos.no/',
    page_title: 'Utekos',
    external_id: 'anon_5eb34f2b-4a49-4db0-956f-b9796d7cc0d5',
    consent: {
      analytics,
      marketing,
      preferences: 'granted',
      source: 'cookiebot',
      version: '1'
    }
  }
}

test('rejects fully granted events without calling storage', async () => {
  let calls = 0
  const store: CanonicalPageViewStore = {
    accept: async () => {
      calls += 1
      return insertedAcceptance
    }
  }

  const result = await acceptCanonicalPageView({
    payload: pageView('granted', 'granted'),
    requestContext: {},
    store
  })

  assert.deepEqual(result, {
    cookiesToSet: [],
    reason: 'consent_granted',
    status: 'rejected'
  })
  assert.equal(calls, 0)
})

test('accepts the event and its provider intents through one storage call', async () => {
  const writes: Parameters<
    CanonicalPageViewStore['accept']
  >[0][] = []
  const store: CanonicalPageViewStore = {
    accept: async input => {
      writes.push(input)
      return insertedAcceptance
    }
  }

  const result = await acceptCanonicalPageView({
    payload: pageView('granted', 'granted'),
    requestContext: {
      clientIpAddress: '203.0.113.10',
      cookieHeader: ''
    },
    store
  })

  assert.equal(result.status, 'accepted')
  assert.equal(writes.length, 1)
  assert.equal(writes[0]?.allowPageViewMarketingRelease, true)
  assert.ok(writes[0]?.event.browser_id?.fbp)
  assert.deepEqual(
    writes[0]?.dispatches.map(dispatch => dispatch.provider),
    ['meta', 'microsoft_uet']
  )
})

test('mints fbp and fbc from landing page_url fbclid before persist', async () => {
  const writes: Parameters<
    CanonicalPageViewStore['accept']
  >[0][] = []
  const store: CanonicalPageViewStore = {
    accept: async input => {
      writes.push(input)
      return insertedAcceptance
    }
  }

  const payload = {
    ...pageView('granted', 'granted'),
    page_url:
      'https://utekos.no/?fbclid=IwAR2F4-dbP0l7Mn1IawQQGCINEz7PYXQvwjNwB_qa2ofrHyiLjcbCRxTDMgk'
  }

  const result = await acceptCanonicalPageView({
    payload,
    requestContext: { clientIpAddress: '203.0.113.10' },
    store
  })

  assert.equal(result.status, 'accepted')
  assert.ok(writes[0]?.event.browser_id?.fbp)
  assert.equal(
    writes[0]?.event.browser_id?.fbc?.split('.')[3],
    'IwAR2F4-dbP0l7Mn1IawQQGCINEz7PYXQvwjNwB_qa2ofrHyiLjcbCRxTDMgk'
  )
  assert.equal(
    writes[0]?.event.click_id?.fbclid,
    'IwAR2F4-dbP0l7Mn1IawQQGCINEz7PYXQvwjNwB_qa2ofrHyiLjcbCRxTDMgk'
  )
  assert.ok(result.cookiesToSet.length >= 1)
})

test('reports an idempotent duplicate returned by storage', async () => {
  const store: CanonicalPageViewStore = {
    accept: async () => duplicateAcceptance
  }

  const result = await acceptCanonicalPageView({
    payload: pageView('granted', 'granted'),
    requestContext: {},
    store
  })

  assert.equal(result.status, 'duplicate')
  assert.equal(
    result.event_id,
    '61c2ef59-6e6f-4f56-a63a-567ca398f9de'
  )
})

test('preserves the canonical IP and retains the SDK-selected IP for Meta', async () => {
  const payload = pageView('granted', 'granted')
  let written:
    | Parameters<CanonicalPageViewStore['accept']>[0]
    | undefined
  await acceptCanonicalPageView({
    payload,
    requestContext: {
      clientIpAddress: '8.8.8.8',
      userAgent: 'Mozilla/5.0',
      cookieHeader:
        '_fbp=fb.1.1784194900000.123456789.AQQCAQMB; _fbi=2606:4700:4700::1111.AQQCAQMB'
    },
    store: {
      accept: async input => {
        written = input
        return insertedAcceptance
      }
    }
  })
  assert.equal(
    written?.event.browser_id?.fbi,
    '2606:4700:4700::1111.AQQCAQMB'
  )
  assert.equal(written?.event.client_ip_address, '8.8.8.8')
  assert.equal(written?.event.event_name, payload.event_name)
  assert.equal(written?.event.event_id, payload.event_id)
  assert.equal(written?.event.event_time, payload.event_time)
  assert.equal(
    written?.event.browser_id?.fbp,
    'fb.1.1784194900000.123456789.AQQCAQMB'
  )
})

test('reports acceptance when an existing page view gains its first Meta attempt', async () => {
  const result = await acceptCanonicalPageView({
    payload: pageView('granted', 'granted'),
    requestContext: {},
    store: {
      accept: async () => ({
        status: 'duplicate',
        createdDispatchAttempts: [
          {
            adapterKey: 'meta:page_view',
            attemptId: '00000000-0000-4000-8000-000000000001'
          }
        ]
      })
    }
  })
  assert.equal(result.status, 'accepted')
})
