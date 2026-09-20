import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { proxy } from './proxy'

const headers = {
  'accept': 'text/html',
  'sec-fetch-dest': 'document'
}

test('first document captures Meta cookies for the browser and the same upstream request', async () => {
  const request = new NextRequest(
    'https://utekos.no/produkter?fbclid=First-Click&utm_source=Meta',
    { headers }
  )
  const response = await proxy(request)
  const fbp = response.cookies.get('_fbp')
  const fbc = response.cookies.get('_fbc')
  assert.ok(fbp)
  assert.ok(fbc)
  assert.equal(fbc.value.split('.')[3], 'First-Click')
  assert.equal(request.cookies.get('_fbp')?.value, fbp.value)
  assert.equal(request.cookies.get('_fbc')?.value, fbc.value)
  assert.ok(
    response.headers
      .get('x-middleware-request-cookie')
      ?.includes(`_fbp=${fbp.value}`)
  )
  assert.equal(fbc.path, '/')
  assert.equal(fbc.domain, 'utekos.no')
  assert.equal(fbc.maxAge, 7776000)
  assert.equal(fbc.secure, true)
  assert.equal(fbc.httpOnly, false)
  assert.equal(fbc.sameSite, 'lax')
  assert.match(
    response.headers.get('cache-control') ?? '',
    /private.*no-store/
  )
  assert.equal(response.headers.get('cookie'), null)
  assert.equal(response.headers.get('location'), null)
})

test('repeat document preserves identity and timestamp; a new click updates fbc only', async () => {
  const first = await proxy(
    new NextRequest('https://utekos.no/?fbclid=First', {
      headers
    })
  )
  const cookie = first.cookies
    .getAll()
    .map(value => `${value.name}=${value.value}`)
    .join('; ')
  const repeated = await proxy(
    new NextRequest('https://utekos.no/produkter?fbclid=First', {
      headers: { ...headers, cookie }
    })
  )
  assert.equal(repeated.headers.get('set-cookie'), null)
  const changed = await proxy(
    new NextRequest(
      'https://utekos.no/produkter?fbclid=Second',
      { headers: { ...headers, cookie } }
    )
  )
  assert.equal(
    changed.cookies.get('_fbc')?.value.split('.')[3],
    'Second'
  )
  assert.equal(changed.cookies.get('_fbp'), undefined)
  assert.ok(
    changed.headers
      .get('x-middleware-request-cookie')
      ?.includes(first.cookies.get('_fbp')!.value)
  )
})

test('organic documents create only fbp and keep host-only cookies outside the production domain', async () => {
  for (const origin of [
    'http://localhost:3000',
    'https://utekos-preview.vercel.app'
  ]) {
    const response = await proxy(
      new NextRequest(`${origin}/produkter`, { headers })
    )
    const fbp = response.cookies.get('_fbp')
    assert.ok(fbp)
    assert.equal(response.cookies.get('_fbc'), undefined)
    assert.equal(fbp.domain, undefined)
    assert.equal(fbp.secure, origin.startsWith('https:'))
  }
})

test('repeated URL click parameters use the first value and do not remint on repeat', async () => {
  const url = 'https://utekos.no/?fbclid=First&fbclid=Second'
  const first = await proxy(new NextRequest(url, { headers }))
  assert.equal(
    first.cookies.get('_fbc')?.value.split('.')[3],
    'First'
  )
  const cookie = first.cookies
    .getAll()
    .map(item => `${item.name}=${item.value}`)
    .join('; ')
  const repeated = await proxy(
    new NextRequest(url, { headers: { ...headers, cookie } })
  )
  assert.equal(repeated.headers.get('set-cookie'), null)
})

test('does not mint on API, feed, RSC, prefetch, assets or non-GET requests', async () => {
  for (const [url, extraHeaders, method] of [
    ['https://utekos.no/api/events/page-view', {}, 'GET'],
    ['https://feed.utekos.no/', {}, 'GET'],
    ['https://utekos.no/produkter', { rsc: '1' }, 'GET'],
    [
      'https://utekos.no/produkter',
      { 'next-router-prefetch': '1' },
      'GET'
    ],
    [
      'https://utekos.no/produkter',
      { purpose: 'prefetch' },
      'GET'
    ],
    ['https://utekos.no/test.png', {}, 'GET'],
    ['https://utekos.no/produkter', {}, 'POST']
  ] as const) {
    const response = await proxy(
      new NextRequest(url, {
        headers: { ...headers, ...extraHeaders },
        method
      })
    )
    assert.equal(response.cookies.get('_fbp'), undefined, url)
    assert.equal(response.cookies.get('_fbc'), undefined, url)
  }
})

test('oversized input does not create oversized cookies or prevent navigation', async t => {
  const warnings: unknown[][] = []
  t.mock.method(console, 'warn', (...args: unknown[]) =>
    warnings.push(args)
  )
  const response = await proxy(
    new NextRequest(
      `https://utekos.no/?fbclid=${'x'.repeat(3001)}`,
      { headers }
    )
  )
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('set-cookie'), null)
  assert.deepEqual(warnings, [
    [
      '[tracking] proxy_meta_capture_skipped',
      { reason: 'identifier_too_large' }
    ]
  ])
})
