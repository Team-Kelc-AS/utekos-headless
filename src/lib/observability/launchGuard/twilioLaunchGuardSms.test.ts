import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import {
  resolveTwilioCallbackUrl,
  sendTwilioLaunchGuardSms,
  verifyTwilioFormSignature
} from './twilioLaunchGuardSms'

const environment = {
  LAUNCH_GUARD_SMS_ENABLED: 'true',
  TWILIO_ALERT_ACCOUNT_SID: `AC${'1'.repeat(32)}`,
  TWILIO_ALERT_AUTH_TOKEN: 'auth-token',
  TWILIO_ALERT_MESSAGING_SERVICE_SID: `MG${'2'.repeat(32)}`,
  TWILIO_ALERT_TO_E164: '+4712345678',
  TWILIO_ALERT_STATUS_CALLBACK_ORIGIN: 'https://utekos.no'
}

test('sends a bounded, privacy-free SMS with a delivery callback', async () => {
  let body = ''
  const result = await sendTwilioLaunchGuardSms({
    environment,
    fetch: async (_input, init) => {
      body = String(init?.body)
      return Response.json({ sid: `SM${'3'.repeat(32)}` })
    },
    message: {
      deliveryId: '11111111-1111-4111-8111-111111111111',
      integration: 'vercel',
      kind: 'incident',
      severity: 'critical',
      summaryCode: 'valid_probe_rejected',
      surface: 'api_log_contract'
    }
  })

  assert.deepEqual(result, {
    status: 'sent',
    providerReceiptId: `SM${'3'.repeat(32)}`
  })
  const form = new URLSearchParams(body)
  assert.match(form.get('StatusCallback') ?? '', /delivery_id=/)
  assert.doesNotMatch(form.get('Body') ?? '', /https?:|customer|journey/i)
})

test('suppresses normal SMS until activation is explicit', async () => {
  const result = await sendTwilioLaunchGuardSms({
    environment: {
      ...environment,
      LAUNCH_GUARD_SMS_ENABLED: 'false'
    },
    fetch: async () => {
      throw new Error('must not send')
    },
    message: {
      deliveryId: '11111111-1111-4111-8111-111111111111',
      integration: 'vercel',
      kind: 'incident',
      severity: 'critical',
      summaryCode: 'valid_probe_rejected',
      surface: 'api_log_contract'
    }
  })

  assert.deepEqual(result, {
    status: 'suppressed',
    code: 'sms_not_enabled'
  })
})

test('verifies Twilio form signatures against the configured public URL', () => {
  const form = new URLSearchParams({
    MessageSid: `SM${'3'.repeat(32)}`,
    MessageStatus: 'delivered'
  })
  const url =
    'https://utekos.no/api/webhooks/twilio/launch-guard-status?delivery_id=11111111-1111-4111-8111-111111111111'
  let payload = url
  for (const name of [...form.keys()].sort()) {
    payload += `${name}${form.get(name)}`
  }
  const signature = createHmac('sha1', 'auth-token')
    .update(payload)
    .digest('base64')

  assert.equal(
    verifyTwilioFormSignature({
      authToken: 'auth-token',
      form,
      signature,
      url
    }),
    true
  )
  assert.equal(
    resolveTwilioCallbackUrl({
      callbackOrigin: 'https://utekos.no',
      requestUrl:
        'https://deployment.vercel.app/api/webhooks/twilio/launch-guard-status?delivery_id=1'
    }),
    'https://utekos.no/api/webhooks/twilio/launch-guard-status?delivery_id=1'
  )
})
