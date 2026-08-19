import assert from 'node:assert/strict'
import test from 'node:test'
import { createBrowserEventRequestHandler } from './createBrowserEventRequestHandler'

test('logs one redacted completion record for an accepted event', async () => {
  const originalInfo = console.info
  const infoCalls: unknown[][] = []
  console.info = (...arguments_) => {
    infoCalls.push(arguments_)
  }

  try {
    const handler = createBrowserEventRequestHandler<null>(
      async () => ({
        event_id: '11111111-1111-4111-8111-111111111111',
        status: 'accepted'
      })
    )
    const response = await handler(
      new Request('https://utekos.no/api/events/view-item', {
        body: JSON.stringify({
          event_id: '11111111-1111-4111-8111-111111111111',
          event_name: 'view_item',
          page_url:
            'https://utekos.no/produkter/utekos-techdown?fbclid=secret-click&utm_source=facebook#details',
          page_view_id: '22222222-2222-4222-8222-222222222222'
        }),
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://utekos.no'
        },
        method: 'POST'
      }),
      {
        getRequestContext: () => ({}),
        store: null
      }
    )

    assert.equal(response.status, 202)
    assert.equal(infoCalls.length, 1)
    assert.equal(infoCalls[0]?.[0], '[tracking] browser event completed')
    assert.deepEqual(infoCalls[0]?.[1], {
      contentLength: '0',
      contentType: 'application/json',
      event_id: '11111111-1111-4111-8111-111111111111',
      event_name: 'view_item',
      method: 'POST',
      origin: 'https://utekos.no',
      page_url: 'https://utekos.no/produkter/utekos-techdown',
      page_view_id: '22222222-2222-4222-8222-222222222222',
      path: '/api/events/view-item',
      status: 'accepted'
    })
  } finally {
    console.info = originalInfo
  }
})
