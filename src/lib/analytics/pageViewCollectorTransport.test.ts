import assert from 'node:assert/strict'
import test from 'node:test'
import { createPageViewCollectorTransport } from './pageViewCollectorTransport'
import {
  createCanonicalPageView,
  type CanonicalPageView
} from './pageViewEvent'

const denied = {
  analytics: 'denied',
  marketing: 'denied',
  preferences: 'denied',
  source: 'cookiebot',
  version: '1'
} as const
function pageView(
  consent: CanonicalPageView['consent'] = {
    ...denied,
    marketing: 'granted'
  },
  id = '11111111-1111-4111-8111-111111111111'
) {
  return createCanonicalPageView({
    environment: 'test',
    eventId: id,
    pageViewId: crypto.randomUUID(),
    eventTime: new Date().toISOString(),
    pageUrl:
      'https://utekos.no/skreddersy-varmen?fbclid=private&utm_content=ad',
    pageTitle: 'Utekos',
    consent,
    browserId: { fbp: 'fb.1.2.3' },
    clickId: { fbclid: 'private' }
  })
}
function harness() {
  let reads = 0
  const captures: CanonicalPageView[] = [],
    sent: CanonicalPageView[] = []
  const deps = {
    capture: async (event: CanonicalPageView) => {
      captures.push(event)
    },
    enrich: async (event: CanonicalPageView) => event,
    getTrackingAuthorization: () => ({}),
    getCookieHeader: () => {
      reads++
      return '_fbp=fb.1.2.3; _ga=GA1.1.1.2'
    },
    send: async (event: CanonicalPageView) => {
      sent.push(event)
    }
  }
  return {
    deps,
    sent,
    captures,
    reads: () => reads
  }
}

test('denied events are not captured, retained, enriched or read from storage', async () => {
  const h = harness(),
    t = createPageViewCollectorTransport(h.deps)
  assert.equal(await t.queue(pageView(denied)), 'skipped')
  await t.flush()
  assert.equal(h.reads(), 0)
  assert.equal(h.captures.length, 0)
  assert.equal(h.sent.length, 0)
})
test('operator policy collects a marketing-granted event with original IDs', async () => {
  const h = harness()
  await createPageViewCollectorTransport(h.deps).queue(pageView())
  assert.equal(h.sent.length, 1)
  assert(h.reads() > 0)
  assert.equal(h.sent[0]?.consent.source, 'cookiebot')
  assert.equal(h.sent[0]?.click_id?.fbclid, 'private')
})
test('a fresh current-page event is captured and sent once with original IDs', async () => {
  const h = harness(),
    t = createPageViewCollectorTransport(h.deps),
    event = pageView()
  assert.equal(await t.queue(event), 'sent')
  await t.queue(event)
  await t.flush()
  assert.equal(h.sent.length, 1)
  assert.equal(h.captures.length, 1)
  assert.equal(h.sent[0]?.event_id, event.event_id)
  assert.equal(h.sent[0]?.page_view_id, event.page_view_id)
  assert.equal(h.sent[0]?.event_time, event.event_time)
  assert.equal(h.sent[0]?.click_id?.fbclid, 'private')
})
test('analytics-only strips click IDs, marketing cookies and URL queries', async () => {
  const h = harness()
  await createPageViewCollectorTransport(h.deps).queue(
    pageView({ ...denied, analytics: 'granted' })
  )
  const event = h.sent[0]!
  assert.equal(event.click_id, undefined)
  assert.equal(
    event.page_url,
    'https://utekos.no/skreddersy-varmen'
  )
  assert.deepEqual(event.browser_id, { ga_client: 'GA1.1.1.2' })
})
test('marketing-only PageView never sends a statistical journey ID', async () => {
  const h = harness()
  const event = {
    ...pageView(),
    journey_id: crypto.randomUUID(),
    previous_page_view_id: crypto.randomUUID()
  }
  await createPageViewCollectorTransport(h.deps).queue(event)
  assert.equal(h.sent.length, 1)
  assert.equal(h.sent[0]?.journey_id, undefined)
  assert.equal(h.sent[0]?.previous_page_view_id, undefined)
})
test('storage or optional enrichment failure still permits a granted event', async () => {
  const h = harness()
  h.deps.getCookieHeader = () => {
    throw new Error('storage unavailable')
  }
  h.deps.enrich = async () => {
    throw new Error('optional enrichment unavailable')
  }
  assert.equal(
    await createPageViewCollectorTransport(h.deps).queue(
      pageView()
    ),
    'sent'
  )
  assert.equal(h.sent.length, 1)
})
test('failed send retries with the same event ID and does not duplicate a completed delivery', async () => {
  const h = harness(),
    event = pageView()
  let attempts = 0
  h.deps.send = async next => {
    if (++attempts === 1) throw new Error('offline')
    h.sent.push(next)
  }
  const t = createPageViewCollectorTransport(h.deps)
  assert.equal(await t.queue(event), 'failed')
  assert.equal(await t.flush(), 'sent')
  await t.flush()
  assert.equal(h.sent.length, 1)
  assert.equal(h.sent[0]?.event_id, event.event_id)
})
test('concurrent flush cannot dispatch the same event twice', async () => {
  const h = harness()
  let resume!: () => void
  h.deps.enrich = event =>
    new Promise(resolve => {
      resume = () => resolve(event)
    })
  const t = createPageViewCollectorTransport(h.deps),
    pending = t.queue(pageView())
  await t.flush()
  resume()
  await pending
  assert.equal(h.sent.length, 1)
})
test('clearing the consented queue cancels a pending enrichment', async () => {
  const h = harness()
  let resume!: () => void
  h.deps.enrich = event =>
    new Promise(resolve => {
      resume = () => resolve(event)
    })
  const t = createPageViewCollectorTransport(h.deps),
    pending = t.queue(pageView())
  t.clear()
  resume()
  await pending
  assert.equal(h.sent.length, 0)
})
test('distinct consented SPA views each dispatch once', async () => {
  const h = harness(),
    t = createPageViewCollectorTransport(h.deps)
  await t.queue(pageView())
  await t.queue(
    pageView(undefined, '22222222-2222-4222-8222-222222222222')
  )
  assert.equal(h.sent.length, 2)
})
