import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/meta/parameter-context/route'

const consent = {
  analytics: 'granted',
  marketing: 'granted',
  preferences: 'granted',
  source: 'cookiebot',
  version: '1'
} as const

function request(
  body: unknown,
  origin = 'http://localhost:3000',
  requestOrigin = 'http://localhost:3000',
  fbclid?: string
) {
  const requestUrl = new URL(
    `${requestOrigin}/api/meta/parameter-context`
  )
  if (fbclid) requestUrl.searchParams.set('fbclid', fbclid)

  return new NextRequest(requestUrl, {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', origin },
    method: 'POST'
  })
}

test('sets first-party Meta cookies for a same-origin landing page', async () => {
  const response = await POST(
    request({
      consent,
      page_url:
        'http://localhost:3000/produkter?fbclid=landing-click'
    })
  )
  const body = (await response.json()) as {
    fbc: string
    fbp: string
  }
  const setCookie = response.headers.get('set-cookie') ?? ''

  assert.equal(response.status, 200)
  assert.match(body.fbc, /^fb\.0\.\d+\.landing-click\./)
  assert.match(body.fbp, /^fb\.0\.\d+\.\d+\./)
  assert.match(setCookie, /_fbc=/)
  assert.match(setCookie, /_fbp=/)
  assert.doesNotMatch(setCookie, /Domain=/i)
  assert.equal(
    response.headers.get('cache-control'),
    'no-store, max-age=0'
  )
})

test('reads fbclid from the parameter-context request query string', async () => {
  const fbclid = 'IwAR-ServerQuery_MixedCase'
  const response = await POST(
    request(
      {
        consent,
        fbclid: 'body-fallback',
        page_url: 'http://localhost:3000/produkter'
      },
      undefined,
      undefined,
      fbclid
    )
  )
  const body = (await response.json()) as { fbc: string }

  assert.equal(response.status, 200)
  assert.equal(body.fbc.split('.')[3], fbclid)
  assert.match(
    body.fbc,
    /^fb\.0\.\d+\.IwAR-ServerQuery_MixedCase\..{8}$/
  )
})

test('sets host-only secure cookies on Vercel preview domains', async () => {
  const previewOrigin =
    'https://utekos-headless-git-meta-preview.vercel.app'
  const response = await POST(
    request(
      {
        consent,
        page_url: `${previewOrigin}/?fbclid=preview-click`
      },
      previewOrigin,
      previewOrigin
    )
  )
  const setCookie = response.headers.get('set-cookie') ?? ''

  assert.equal(response.status, 200)
  assert.match(setCookie, /_fbc=/)
  assert.match(setCookie, /_fbp=/)
  assert.match(setCookie, /Secure/i)
  assert.doesNotMatch(setCookie, /Domain=/i)
})

test('rejects cross-origin and non-consented parameter requests', async () => {
  const crossOrigin = await POST(
    request(
      { consent, page_url: 'http://localhost:3000/' },
      'https://attacker.example'
    )
  )
  const granted = await POST(
    request({
      consent: { ...consent, marketing: 'granted' },
      page_url: 'http://localhost:3000/'
    })
  )

  assert.equal(crossOrigin.status, 403)
  assert.equal(granted.status, 400)
})
