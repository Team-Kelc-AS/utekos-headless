import assert from 'node:assert/strict'
import test from 'node:test'
import { createBrowserEventRequestHandler } from './createBrowserEventRequestHandler'
import { handleCanonicalPageViewRoute } from './handleCanonicalPageViewRoute'
import { handleCanonicalWebVitalRoute } from './handleCanonicalWebVitalRoute'

for (const [path, handleRoute] of [
  ['/api/e/wv', handleCanonicalWebVitalRoute],
  ['/api/events/web-vital', handleCanonicalWebVitalRoute],
  ['/api/events/page-view/capture', handleCanonicalPageViewRoute]
] as const) {
  for (const origin of [
    undefined,
    'https://utekos.no',
    'https://attacker.example'
  ]) {
    test(`${path}: HeadlessChrome is excluded without reading or storing payload (origin=${origin})`, async () => {
      const incoming = new Request(`https://utekos.no${path}`, {
        method: 'POST',
        body: 'invalid JSON is deliberately never read',
        headers: {
          'user-agent': 'HeadlessChrome/141.0.7390.0',
          ...(origin ? { origin } : {})
        }
      })
      let collected = false
      const response = await handleRoute(incoming, {
        collect: async () => {
          collected = true
          throw new Error(
            'Automation must never reach the collector'
          )
        }
      })
      assert.equal(response.status, 204)
      assert.equal(
        response.headers.get('x-utekos-traffic-classification'),
        'automated_bot'
      )
      assert.equal(
        response.headers.get('cache-control'),
        'no-store, max-age=0'
      )
      assert.equal(await response.text(), '')
      assert.equal(incoming.bodyUsed, false)
      assert.equal(collected, false)
    })
  }
}

for (const origin of [
  undefined,
  'https://attacker.example',
  'https://utekos.no'
]) {
  test(`ordinary browser retains origin validation (origin=${origin})`, async () => {
    const incoming = new Request('https://utekos.no/api/e/wv', {
      method: 'POST',
      headers: {
        'user-agent':
          'Mozilla/5.0 Chrome/141.0.7390.0 Safari/537.36',
        'content-type': 'application/json',
        ...(origin ? { origin } : {})
      },
      body: '{}'
    })
    let accepted = false
    const collector = createBrowserEventRequestHandler<
      Record<string, never>
    >(async () => {
      accepted = true
      return { status: 'accepted', event_id: 'test' }
    })
    const response = await handleCanonicalWebVitalRoute(
      incoming,
      {
        collect: request =>
          collector(request, {
            getRequestContext: () => ({}),
            store: {}
          })
      }
    )
    const sameOrigin = origin === 'https://utekos.no'
    assert.equal(response.status, sameOrigin ? 202 : 403)
    assert.equal(accepted, sameOrigin)
  })
}
