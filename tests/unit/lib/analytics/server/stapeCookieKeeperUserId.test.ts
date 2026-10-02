import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest, NextResponse } from 'next/server'
import {
  COOKIE_KEEPER_USER_ID_COOKIE,
  COOKIE_KEEPER_USER_ID_MAX_AGE_SECONDS,
  applyCookieKeeperUserIdCookie,
  createCookieKeeperUserId,
  isValidCookieKeeperUserId,
  resolveCookieKeeperUserId
} from '@/lib/analytics/server/stapeCookieKeeperUserId'

test('accepts only 32-char hex Cookie Keeper user ids', () => {
  assert.equal(
    isValidCookieKeeperUserId('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
    true
  )
  assert.equal(
    isValidCookieKeeperUserId('AAAAAAAAAAAAAAAABBBBBBBBBBBBBBBB'),
    true
  )
  assert.equal(isValidCookieKeeperUserId('anon_uuid-here'), false)
  assert.equal(isValidCookieKeeperUserId('short'), false)
  assert.equal(isValidCookieKeeperUserId(''), false)
  assert.equal(isValidCookieKeeperUserId(undefined), false)
  assert.equal(isValidCookieKeeperUserId(null), false)
})

test('createCookieKeeperUserId strips UUID hyphens to 32 hex chars', () => {
  const value = createCookieKeeperUserId(
    () => '550e8400-e29b-41d4-a716-446655440000'
  )
  assert.equal(value, '550e8400e29b41d4a716446655440000')
  assert.equal(isValidCookieKeeperUserId(value), true)
})

test('resolveCookieKeeperUserId preserves a valid existing value', () => {
  const existing = '0123456789abcdef0123456789abcdef'
  assert.equal(
    resolveCookieKeeperUserId(existing, () => {
      throw new Error('must not mint')
    }),
    existing
  )
})

test('resolveCookieKeeperUserId mints when missing or invalid', () => {
  const minted = resolveCookieKeeperUserId(
    'not-valid',
    () => 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
  )
  assert.equal(minted, 'aaaaaaaabbbb4ccc8dddeeeeeeeeeeee')
  assert.equal(
    resolveCookieKeeperUserId(
      undefined,
      () => '11111111-2222-4333-8444-555555555555'
    ),
    '11111111222243338444555555555555'
  )
})

test('applyCookieKeeperUserIdCookie sets Stape-required attributes on production host', () => {
  const request = new NextRequest('https://utekos.no/produkter', {
    headers: { accept: 'text/html', 'sec-fetch-dest': 'document' }
  })
  const response = applyCookieKeeperUserIdCookie(
    NextResponse.next(),
    request
  )
  const cookie = response.cookies.get(COOKIE_KEEPER_USER_ID_COOKIE)
  assert.ok(cookie)
  assert.equal(isValidCookieKeeperUserId(cookie.value), true)
  assert.equal(cookie.domain, 'utekos.no')
  assert.equal(cookie.path, '/')
  assert.equal(cookie.httpOnly, false)
  assert.equal(cookie.secure, true)
  assert.equal(cookie.sameSite, 'lax')
  assert.equal(cookie.maxAge, COOKIE_KEEPER_USER_ID_MAX_AGE_SECONDS)
  assert.match(
    response.headers.get('cache-control') ?? '',
    /private.*no-store/
  )
})

test('applyCookieKeeperUserIdCookie refreshes Max-Age without changing value', () => {
  const existing = 'fedcba9876543210fedcba9876543210'
  const request = new NextRequest('https://utekos.no/', {
    headers: {
      accept: 'text/html',
      cookie: `${COOKIE_KEEPER_USER_ID_COOKIE}=${existing}`,
      'sec-fetch-dest': 'document'
    }
  })
  const response = applyCookieKeeperUserIdCookie(
    NextResponse.next(),
    request
  )
  const cookie = response.cookies.get(COOKIE_KEEPER_USER_ID_COOKIE)
  assert.equal(cookie?.value, existing)
  assert.equal(cookie?.maxAge, COOKIE_KEEPER_USER_ID_MAX_AGE_SECONDS)
})

test('applyCookieKeeperUserIdCookie keeps host-only cookies outside production domain', () => {
  const request = new NextRequest('http://localhost:3000/', {
    headers: { accept: 'text/html', 'sec-fetch-dest': 'document' }
  })
  const response = applyCookieKeeperUserIdCookie(
    NextResponse.next(),
    request
  )
  const cookie = response.cookies.get(COOKIE_KEEPER_USER_ID_COOKIE)
  assert.ok(cookie)
  assert.equal(cookie.domain, undefined)
  assert.equal(cookie.secure, false)
})

test('applyCookieKeeperUserIdCookie remints invalid existing values', () => {
  const request = new NextRequest('https://www.utekos.no/', {
    headers: {
      accept: 'text/html',
      cookie: `${COOKIE_KEEPER_USER_ID_COOKIE}=bad`,
      'sec-fetch-dest': 'document'
    }
  })
  const response = applyCookieKeeperUserIdCookie(
    NextResponse.next(),
    request
  )
  const cookie = response.cookies.get(COOKIE_KEEPER_USER_ID_COOKIE)
  assert.ok(cookie)
  assert.notEqual(cookie.value, 'bad')
  assert.equal(isValidCookieKeeperUserId(cookie.value), true)
  assert.equal(cookie.domain, 'utekos.no')
})
