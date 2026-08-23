import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createPageViewCollectorTransport,
  type CookiebotState
} from './pageViewCollectorTransport'
import {
  createCanonicalPageView,
  type CanonicalPageView
} from './pageViewEvent'

const deniedConsent = {
  analytics: 'denied' as const,
  marketing: 'denied' as const,
  preferences: 'denied' as const,
  source: 'cookiebot' as const,
  version: '1'
}

function pageView(
  eventId = '11111111-1111-4111-8111-111111111111',
  pageViewId = '22222222-2222-4222-8222-222222222222',
  pageUrl = 'https://utekos.no/',
  edgeRequestId?: string
) {
  return createCanonicalPageView({
    ...(edgeRequestId ? { edgeRequestId } : {}),
    environment: 'test',
    eventId,
    pageViewId,
    eventTime: '2026-07-15T12:00:00.000Z',
    pageUrl,
    pageTitle: 'Utekos',
    consent: deniedConsent,
    browserId: { fbp: 'fb.1.existing' },
    clickId: { fbclid: 'meta-click', gclid: 'google-click' },
    impressionId: 'impression-1'
  })
}

function harness(initialCookiebot: CookiebotState | undefined) {
  let cookiebot = initialCookiebot
  const captures: Array<{
    event: CanonicalPageView
    state: 'pending' | 'denied' | 'granted'
  }> = []
  const sent: CanonicalPageView[] = []

  const transport = createPageViewCollectorTransport({
    capture: async (event, state) => {
      captures.push({ event, state })
    },
    enrich: async event => event,
    getCookiebot: () => cookiebot,
    getCookieHeader: () =>
      [
        '_fbp=fb.1.123',
        '_fbc=fb.1.456',
        '_ga=GA1.1.123.456'
      ].join('; '),
    send: async event => {
      sent.push(event)
    }
  })

  return {
    captures,
    sent,
    setCookiebot(value: CookiebotState) {
      cookiebot = value
    },
    transport
  }
}

test('holds page_view while consent is pending', async () => {
  const context = harness(undefined)
  const event = pageView()

  await context.transport.queue(event)

  assert.equal(context.sent.length, 0)
  assert.equal(context.captures.length, 1)
  assert.equal(context.captures[0]?.state, 'pending')
  assert.deepEqual(
    context.captures[0]?.event.click_id,
    event.click_id
  )

  context.setCookiebot({
    hasResponse: true,
    consent: {
      marketing: false,
      preferences: false,
      statistics: true
    }
  })

  await context.transport.flush()

  assert.equal(context.sent.length, 1)
  assert.equal(context.captures.at(-1)?.state, 'granted')
  assert.equal(context.sent[0]?.event_id, event.event_id)
  assert.equal(context.sent[0]?.event_time, event.event_time)
})

test('does not send when analytics and marketing are denied', async () => {
  const context = harness({
    declined: true,
    hasResponse: true,
    consent: {
      marketing: false,
      preferences: false,
      statistics: false
    }
  })

  await context.transport.queue(pageView())
  await context.transport.flush()

  assert.equal(context.sent.length, 0)
  assert.equal(context.captures.length, 1)
  assert.equal(context.captures[0]?.state, 'denied')
  assert.deepEqual(context.captures[0]?.event.click_id, {
    fbclid: 'meta-click',
    gclid: 'google-click'
  })
})

test('sends the pending current page_view once after late consent grant', async () => {
  const context = harness({
    declined: true,
    hasResponse: true,
    consent: {
      marketing: false,
      preferences: false,
      statistics: false
    }
  })
  const event = pageView()

  assert.equal(await context.transport.queue(event), 'captured')
  assert.equal(context.sent.length, 0)

  context.setCookiebot({
    consented: true,
    hasResponse: true,
    consent: {
      marketing: true,
      preferences: false,
      statistics: true
    }
  })

  assert.deepEqual(
    await Promise.all([
      context.transport.flush(),
      context.transport.flush(),
      context.transport.queue(event)
    ]),
    ['sent', 'skipped', 'skipped']
  )
  assert.equal(context.sent.length, 1)
  assert.equal(context.sent[0]?.event_id, event.event_id)
  assert.equal(context.sent[0]?.page_view_id, event.page_view_id)
  assert.equal(context.sent[0]?.event_time, event.event_time)
  assert.equal(context.sent[0]?.consent.analytics, 'granted')
  assert.equal(context.sent[0]?.consent.marketing, 'granted')
  assert.deepEqual(context.sent[0]?.click_id, event.click_id)
  assert.deepEqual(context.sent[0]?.browser_id, {
    fbc: 'fb.1.456',
    fbp: 'fb.1.123',
    ga_client: 'GA1.1.123.456'
  })
  assert.equal(await context.transport.flush(), 'skipped')
  assert.equal(context.sent.length, 1)
})

test('late grant sends only the latest page viewed while denied', async () => {
  const context = harness({
    declined: true,
    hasResponse: true,
    consent: {
      marketing: false,
      preferences: false,
      statistics: false
    }
  })

  await context.transport.queue(
    pageView(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      'https://utekos.no/skreddersy-varmen'
    )
  )

  await context.transport.queue(
    pageView(
      '33333333-3333-4333-8333-333333333333',
      '44444444-4444-4444-8444-444444444444',
      'https://utekos.no/produkter'
    )
  )

  assert.deepEqual(
    context.captures.map(capture => capture.event.page_url),
    [
      'https://utekos.no/skreddersy-varmen',
      'https://utekos.no/produkter'
    ]
  )

  context.setCookiebot({
    consented: true,
    hasResponse: true,
    consent: {
      marketing: true,
      preferences: false,
      statistics: true
    }
  })

  assert.equal(await context.transport.flush(), 'sent')
  assert.deepEqual(
    context.sent.map(event => ({
      eventId: event.event_id,
      pageUrl: event.page_url,
      pageViewId: event.page_view_id
    })),
    [
      {
        eventId: '33333333-3333-4333-8333-333333333333',
        pageUrl: 'https://utekos.no/produkter',
        pageViewId: '44444444-4444-4444-8444-444444444444'
      }
    ]
  )
})

test('sends after analytics-only consent without marketing identifiers', async () => {
  const context = harness({
    hasResponse: true,
    consent: {
      marketing: false,
      preferences: false,
      statistics: true
    }
  })

  await context.transport.queue(pageView())

  assert.equal(context.sent.length, 1)
  assert.equal(context.sent[0]?.consent.analytics, 'granted')
  assert.equal(context.sent[0]?.consent.marketing, 'denied')
  assert.equal(context.sent[0]?.browser_id, undefined)
  assert.equal(context.sent[0]?.click_id, undefined)
  assert.equal(context.sent[0]?.impression_id, undefined)
})

test('sends after marketing-only consent with consented identifiers', async () => {
  const context = harness({
    consented: true,
    hasResponse: true,
    consent: {
      marketing: true,
      preferences: false,
      statistics: false
    }
  })

  await context.transport.queue(pageView())

  assert.equal(context.sent.length, 1)
  assert.equal(context.sent[0]?.consent.analytics, 'denied')
  assert.equal(context.sent[0]?.consent.marketing, 'granted')
  assert.deepEqual(context.sent[0]?.browser_id, {
    fbc: 'fb.1.456',
    fbp: 'fb.1.123'
  })
  assert.deepEqual(context.sent[0]?.click_id, {
    fbclid: 'meta-click',
    gclid: 'google-click'
  })
})

test('repeated consent updates do not resend the event', async () => {
  const context = harness(undefined)

  await context.transport.queue(pageView())

  context.setCookiebot({
    consented: true,
    hasResponse: true,
    consent: {
      marketing: true,
      preferences: false,
      statistics: true
    }
  })

  await Promise.all([
    context.transport.flush(),
    context.transport.flush(),
    context.transport.flush()
  ])

  assert.equal(context.sent.length, 1)
})

test('the same event_id is attempted at most once', async () => {
  const context = harness({
    hasResponse: true,
    consent: {
      marketing: false,
      preferences: false,
      statistics: true
    }
  })
  const event = pageView()

  await context.transport.queue(event)
  await context.transport.queue(event)

  assert.equal(context.sent.length, 1)
})

test('starts a signed browser receipt before collector send after consent', async () => {
  const order: string[] = []
  const observations: unknown[] = []
  const edgeRequestId = '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd'
  const token =
    '1754029200.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq'
  const transport = createPageViewCollectorTransport({
    capture: async () => undefined,
    enrich: async event => event,
    getCookiebot: () => ({
      hasResponse: true,
      consent: {
        marketing: false,
        preferences: false,
        statistics: true
      }
    }),
    getCookieHeader: () => '',
    observeDispatch: async observation => {
      order.push('browser_dispatch')
      observations.push(observation)
    },
    send: async () => {
      order.push('collector_send')
    }
  })
  const event = pageView(
    undefined,
    undefined,
    undefined,
    edgeRequestId
  )

  assert.equal(
    await transport.queue(event, { edgeRequestId, token }),
    'sent'
  )
  await new Promise<void>(resolve => setImmediate(resolve))

  assert.deepEqual(order, ['browser_dispatch', 'collector_send'])
  assert.deepEqual(observations, [
    {
      correlation_token: token,
      edge_request_id: edgeRequestId,
      event_id: event.event_id,
      event_name: 'page_view',
      page_view_id: event.page_view_id
    }
  ])
})

test('collector send continues when browser receipt fails', async () => {
  let sends = 0
  const edgeRequestId = '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd'
  const transport = createPageViewCollectorTransport({
    capture: async () => undefined,
    enrich: async event => event,
    getCookiebot: () => ({
      hasResponse: true,
      consent: {
        marketing: false,
        preferences: false,
        statistics: true
      }
    }),
    getCookieHeader: () => '',
    observeDispatch: async () => {
      throw new Error('receipt unavailable')
    },
    send: async () => {
      sends += 1
    }
  })

  assert.equal(
    await transport.queue(
      pageView(undefined, undefined, undefined, edgeRequestId),
      {
        edgeRequestId,
        token:
          '1754029200.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq'
      }
    ),
    'sent'
  )
  assert.equal(sends, 1)
})

test('retries a failed page_view on a later flush', async () => {
  let attempts = 0
  const sent: CanonicalPageView[] = []
  const transport = createPageViewCollectorTransport({
    capture: async () => undefined,
    enrich: async event => event,
    getCookiebot: () => ({
      hasResponse: true,
      consent: {
        marketing: false,
        preferences: false,
        statistics: true
      }
    }),
    getCookieHeader: () => '',
    send: async event => {
      attempts += 1
      if (attempts === 1) {
        throw new Error('transient collector failure')
      }
      sent.push(event)
    }
  })
  const event = pageView()

  assert.equal(await transport.queue(event), 'failed')
  assert.equal(await transport.flush(), 'sent')
  assert.equal(await transport.flush(), 'skipped')
  assert.equal(attempts, 2)
  assert.deepEqual(
    sent.map(sentEvent => sentEvent.event_id),
    [event.event_id]
  )
})

test('does not send an in-flight page_view concurrently', async () => {
  let attempts = 0
  let releaseSend: (() => void) | undefined
  const sendGate = new Promise<void>(resolve => {
    releaseSend = resolve
  })
  const transport = createPageViewCollectorTransport({
    capture: async () => undefined,
    enrich: async event => event,
    getCookiebot: () => ({
      hasResponse: true,
      consent: {
        marketing: false,
        preferences: false,
        statistics: true
      }
    }),
    getCookieHeader: () => '',
    send: async () => {
      attempts += 1
      await sendGate
    }
  })
  const event = pageView()

  const firstSend = transport.queue(event)
  const concurrentFlush = transport.flush()
  const concurrentQueue = transport.queue(event)

  await new Promise<void>(resolve => setImmediate(resolve))
  assert.equal(attempts, 1)

  releaseSend?.()
  const results = await Promise.all([
    firstSend,
    concurrentFlush,
    concurrentQueue
  ])
  assert.equal(
    results.filter(result => result === 'sent').length,
    1
  )
  assert.equal(
    results.filter(result => result === 'skipped').length,
    2
  )
  assert.equal(await transport.queue(event), 'skipped')
  assert.equal(attempts, 1)
})

test('distinct SPA page views are each sent once', async () => {
  const context = harness({
    hasResponse: true,
    consent: {
      marketing: false,
      preferences: false,
      statistics: true
    }
  })

  await context.transport.queue(
    pageView(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      'https://utekos.no/'
    )
  )
  await context.transport.queue(
    pageView(
      '33333333-3333-4333-8333-333333333333',
      '44444444-4444-4444-8444-444444444444',
      'https://utekos.no/produkter'
    )
  )

  assert.equal(context.sent.length, 2)
  assert.notEqual(
    context.sent[0]?.event_id,
    context.sent[1]?.event_id
  )
})

test('keeps every SPA page view while consent is pending', async () => {
  const context = harness(undefined)

  await context.transport.queue(
    pageView(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      'https://utekos.no/'
    )
  )
  await context.transport.queue(
    pageView(
      '33333333-3333-4333-8333-333333333333',
      '44444444-4444-4444-8444-444444444444',
      'https://utekos.no/produkter'
    )
  )

  context.setCookiebot({
    hasResponse: true,
    consent: {
      marketing: false,
      preferences: false,
      statistics: true
    }
  })

  await context.transport.flush()

  assert.deepEqual(
    context.sent.map(event => event.page_url),
    ['https://utekos.no/', 'https://utekos.no/produkter']
  )
})
