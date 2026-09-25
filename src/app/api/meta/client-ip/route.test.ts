import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { POST } from './route'

const consent = {
  analytics: 'denied',
  marketing: 'granted',
  preferences: 'denied',
  source: 'cookiebot',
  version: '1'
} as const

function request(
  body: unknown,
  origin = 'http://localhost:3000'
) {
  return new NextRequest(
    'http://localhost:3000/api/meta/client-ip',
    {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'x-real-ip': '203.0.113.8',
        origin
      },
      method: 'POST'
    }
  )
}

test('returns the request IP only after marketing consent', async () => {
  const response = await POST(request({ consent }))
  const body = (await response.json()) as {
    client_ip_address: string
  }

  assert.equal(response.status, 200)
  assert.equal(body.client_ip_address, '203.0.113.8')
  assert.equal(
    response.headers.get('cache-control'),
    'no-store, max-age=0'
  )
})

test('rejects denied consent and cross-origin requests', async () => {
  const denied = await POST(
    request({ consent: { ...consent, marketing: 'denied' } })
  )
  const crossOrigin = await POST(
    request({ consent }, 'https://attacker.example')
  )

  assert.equal(denied.status, 400)
  assert.equal(crossOrigin.status, 403)
})

test('excludes HeadlessChrome without returning an IP or reading its body', async () => {
  const incoming = new NextRequest(
    'https://utekos.no/api/meta/client-ip',
    {
      method: 'POST',
      body: 'not json',
      headers: {
        'user-agent': 'HeadlessChrome/141.0.7390.0',
        'x-real-ip': '203.0.113.8'
      }
    }
  )
  const response = await POST(incoming)
  assert.equal(response.status, 204)
  assert.equal(
    response.headers.get('x-utekos-traffic-classification'),
    'automated_bot'
  )
  assert.equal(await response.text(), '')
  assert.equal(incoming.bodyUsed, false)
})

test('ordinary browser without Origin remains forbidden', async () => {
  const incoming = request({ consent })
  incoming.headers.delete('origin')
  incoming.headers.set('user-agent', 'Chrome/141.0.7390.0')
  const response = await POST(incoming)
  assert.equal(response.status, 403)
  assert.deepEqual(await response.json(), {
    error: 'forbidden_origin'
  })
})
