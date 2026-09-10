import assert from 'node:assert/strict'
import test from 'node:test'
import { POST as consent } from '../../src/app/api/observability/landing-consent/route'
import { POST as dispatch } from '../../src/app/api/observability/page-view-dispatch/route'

test('legacy visitor/edge observation routes are retired without reading request bodies or opening a database', async () => {
  for (const endpoint of [consent, dispatch]) {
    const response = endpoint()
    assert.equal(response.status, 410)
    assert.match(
      response.headers.get('cache-control') ?? '',
      /no-store/
    )
    assert.equal(
      (await response.json()).error,
      'observation_retired'
    )
  }
})
