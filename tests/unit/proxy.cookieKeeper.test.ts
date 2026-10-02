import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import {
  COOKIE_KEEPER_USER_ID_COOKIE,
  COOKIE_KEEPER_USER_ID_MAX_AGE_SECONDS,
  isValidCookieKeeperUserId
} from '@/lib/analytics/server/stapeCookieKeeperUserId'
import { proxy } from '@/proxy'

const headers = {
  'accept': 'text/html',
  'sec-fetch-dest': 'document'
}

test('document navigation mints Cookie Keeper user_id with Stape attributes', async () => {
  const response = await proxy(
    new NextRequest('https://utekos.no/produkter', { headers })
  )
  const userId = response.cookies.get(COOKIE_KEEPER_USER_ID_COOKIE)
  assert.ok(userId)
  assert.equal(isValidCookieKeeperUserId(userId.value), true)
  assert.equal(userId.domain, 'utekos.no')
  assert.equal(userId.path, '/')
  assert.equal(userId.httpOnly, false)
  assert.equal(userId.secure, true)
  assert.equal(userId.sameSite, 'lax')
  assert.equal(userId.maxAge, COOKIE_KEEPER_USER_ID_MAX_AGE_SECONDS)
})

test('repeat document preserves Cookie Keeper user_id and refreshes Max-Age', async () => {
  const first = await proxy(
    new NextRequest('https://utekos.no/', { headers })
  )
  const minted = first.cookies.get(COOKIE_KEEPER_USER_ID_COOKIE)
  assert.ok(minted)

  const cookieHeader = first.cookies
    .getAll()
    .map(item => `${item.name}=${item.value}`)
    .join('; ')
  const repeated = await proxy(
    new NextRequest('https://utekos.no/produkter', {
      headers: { ...headers, cookie: cookieHeader }
    })
  )
  const refreshed = repeated.cookies.get(
    COOKIE_KEEPER_USER_ID_COOKIE
  )
  assert.equal(refreshed?.value, minted.value)
  assert.equal(
    refreshed?.maxAge,
    COOKIE_KEEPER_USER_ID_MAX_AGE_SECONDS
  )
})

test('does not mint Cookie Keeper user_id on API, RSC, prefetch or assets', async () => {
  for (const [url, extraHeaders, method] of [
    ['https://utekos.no/api/events/page-view', {}, 'GET'],
    ['https://utekos.no/produkter', { rsc: '1' }, 'GET'],
    [
      'https://utekos.no/produkter',
      { 'next-router-prefetch': '1' },
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
    assert.equal(
      response.cookies.get(COOKIE_KEEPER_USER_ID_COOKIE),
      undefined,
      url
    )
  }
})
