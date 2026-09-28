import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHash, createHmac } from 'node:crypto'
import { verifyVippsWebhook } from '@/lib/vipps/verifyWebhook'

function signed() {
  const rawBody = '{"reference":"utekos-example-1"}'
  const registeredUrl = 'https://utekos.no/api/vipps/webhook'
  const date = 'Sun, 27 Sep 2026 00:00:00 GMT'
  const secret = 'test-fixture-not-a-real-secret'
  const digest = createHash('sha256')
    .update(rawBody)
    .digest('base64')
  const signature = createHmac('sha256', secret)
    .update(
      `POST\n/api/vipps/webhook\n${date};utekos.no;${digest}`
    )
    .digest('base64')
  const headers = new Headers({
    'x-ms-date': date,
    'x-ms-content-sha256': digest,
    'authorization': `HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=${signature}`
  })
  return {
    rawBody,
    registeredUrl,
    requestUrl: registeredUrl,
    headers,
    secret
  }
}
test('accept authentic raw-body signature', () =>
  assert.equal(verifyVippsWebhook(signed()), true))
test('reject modified body, path, secret and authorization', () => {
  const value = signed()
  for (const change of [
    { rawBody: value.rawBody + ' ' },
    { requestUrl: value.requestUrl + '?extra=1' },
    { secret: 'wrong' },
    { headers: new Headers() }
  ]) {
    assert.equal(
      verifyVippsWebhook({ ...value, ...change }),
      false
    )
  }
})
test('forwarded Host cannot select signed host', () => {
  const value = signed()
  value.headers.set('host', 'attacker.example')
  assert.equal(verifyVippsWebhook(value), true)
  assert.equal(
    verifyVippsWebhook({
      ...value,
      registeredUrl: 'https://attacker.example/api/vipps/webhook'
    }),
    false
  )
})
