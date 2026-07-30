import assert from 'node:assert/strict'
import test from 'node:test'
import {
  parseArgs,
  summarizeRouteRequests
} from './measure-pdp-baseline.mjs'

test('parseArgs validates external options', () => {
  assert.equal(
    parseArgs(['--base-url=https://utekos.no/', '--runs=3'])
      .runs,
    3
  )
  assert.throws(
    () =>
      parseArgs(['--base-url=https://user:secret@utekos.no']),
    /base-url must not contain credentials/
  )
  assert.throws(() => parseArgs(['--runs=0']))
  assert.throws(() => parseArgs(['--label=../outside']))
})

test('route requests classify server actions without claiming action identity', () => {
  const requests = [
    {
      url: 'https://utekos.no/produkter/utekos-techdown?variant=private',
      method: 'POST',
      status: 200,
      transferredBytes: 512,
      requestHeaders: { 'next-action': 'opaque-action-id' },
      responseHeaders: { 'x-vercel-cache': 'MISS' }
    },
    {
      url: 'https://utekos.no/produkter/utekos-techdown?_rsc=abc',
      method: 'GET',
      status: 200,
      transferredBytes: 1024,
      requestHeaders: { rsc: '1' },
      responseHeaders: { 'x-vercel-cache': 'HIT' }
    }
  ]

  const report = summarizeRouteRequests(
    requests,
    'https://utekos.no'
  )

  assert.equal(report.serverActionRequestCount, 1)
  assert.equal(report.rscFetchCount, 1)
  assert.deepEqual(report.serverActionRequests[0], {
    method: 'POST',
    pathname: '/produkter/utekos-techdown',
    status: 200,
    transferredBytes: 512,
    vercelCache: 'MISS'
  })
  assert.equal(
    Object.hasOwn(report.serverActionRequests[0], 'url'),
    false
  )
})
