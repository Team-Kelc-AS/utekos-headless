import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import { handleTwilioLaunchGuardStatus } from './route'

const deliveryId = '11111111-1111-4111-8111-111111111111'
const messageSid = `SM${'1'.repeat(32)}`
const publicUrl =
  `https://utekos.no/api/webhooks/twilio/launch-guard-status?delivery_id=${deliveryId}`

function signedRequest(status = 'delivered') {
  const form = new URLSearchParams({
    MessageSid: messageSid,
    MessageStatus: status
  })
  let payload = publicUrl
  for (const name of [...form.keys()].sort()) {
    payload += `${name}${form.get(name)}`
  }
  const signature = createHmac('sha1', 'auth-token')
    .update(payload)
    .digest('base64')

  return new Request(
    publicUrl.replace('utekos.no', 'deployment.vercel.app'),
    {
      body: form,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': signature
      },
      method: 'POST'
    }
  )
}

test('accepts a signed delivered callback and records the receipt', async () => {
  const updates: Array<Record<string, unknown>> = []
  const response = await handleTwilioLaunchGuardStatus(
    signedRequest(),
    {
      getAuthToken: () => 'auth-token',
      getCallbackOrigin: () => 'https://utekos.no',
      now: () => new Date('2026-08-29T12:00:00.000Z'),
      updateDelivery: async input => {
        updates.push(input)
        return true
      }
    }
  )

  assert.equal(response.status, 204)
  assert.equal(updates[0]?.status, 'delivered')
  assert.equal(updates[0]?.messageSid, messageSid)
})

test('rejects an invalid Twilio signature before database access', async () => {
  const request = signedRequest()
  request.headers.set('X-Twilio-Signature', 'invalid')
  const response = await handleTwilioLaunchGuardStatus(request, {
    getAuthToken: () => 'auth-token',
    getCallbackOrigin: () => 'https://utekos.no',
    now: () => new Date(),
    updateDelivery: async () => {
      throw new Error('must not update')
    }
  })

  assert.equal(response.status, 401)
})
