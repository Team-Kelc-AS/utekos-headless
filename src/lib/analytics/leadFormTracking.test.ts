import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { buildLeadUserDataHashes } from './buildLeadUserDataHashes'
import {
  createCanonicalGenerateLead,
  buildGenerateLeadDataLayerEvent
} from './generateLeadEvent'
import {
  deniedCookiebotConsent,
  parseLeadFormTrackingContext,
  LEAD_TRACKING_CONTEXT_FIELD
} from './leadFormTrackingContext'
import {
  LEAD_FORM_IDS,
  LEAD_TYPES
} from '@/lib/leads/leadFormIds'
import { normalizeCustomerMatchEmail } from '@/lib/google/data-manager/normalizeCustomerMatchEmail'
import { normalizeCustomerMatchPhone } from '@/lib/google/data-manager/normalizeCustomerMatchPhone'
import { normalizeCanonicalGenerateLead } from './server/normalizeCanonicalGenerateLead'

test('buildLeadUserDataHashes normalizes and sha256-hashes email and phone', () => {
  const hashes = buildLeadUserDataHashes({
    email: ' Kari.Nordmann@Example.COM ',
    phone: '+47 123 45 678'
  })

  const expectedEmail = createHash('sha256')
    .update(
      normalizeCustomerMatchEmail(
        ' Kari.Nordmann@Example.COM '
      )!,
      'utf8'
    )
    .digest('hex')
  const expectedPhone = createHash('sha256')
    .update(
      normalizeCustomerMatchPhone('+47 123 45 678')!,
      'utf8'
    )
    .digest('hex')

  assert.deepEqual(hashes.emailSha256, [expectedEmail])
  assert.deepEqual(hashes.phoneSha256, [expectedPhone])
})

test('createCanonicalGenerateLead includes form metadata and hashed user_data', () => {
  const submissionId = 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7'
  const hashes = buildLeadUserDataHashes({
    email: 'kari@example.com',
    phone: '+4712345678'
  })

  const event = createCanonicalGenerateLead({
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    customData: {
      submission_id: submissionId,
      form_id: LEAD_FORM_IDS.productWaitlistUtekosDun,
      lead_type: LEAD_TYPES.productWaitlist,
      currency: 'NOK',
      value: 0
    },
    environment: 'test',
    eventId: submissionId,
    eventTime: '2026-07-18T10:00:00.000Z',
    pageUrl: 'https://utekos.no/produkter/utekos-dun',
    referrerUrl: 'https://utekos.no/produkter',
    journeyId: '11111111-1111-4111-8111-111111111111',
    pageViewId: '22222222-2222-4222-8222-222222222222',
    userData: hashes
  })

  assert.equal(event.event_name, 'generate_lead')
  assert.equal(event.source, 'server')
  assert.equal(
    event.custom_data.form_id,
    'product_waitlist_utekos_dun'
  )
  assert.equal(event.custom_data.lead_type, 'product_waitlist')
  assert.equal(event.custom_data.currency, 'NOK')
  assert.equal(event.custom_data.value, 0)
  assert.equal(event.user_data?.email_sha256?.length, 1)
  assert.equal(event.user_data?.phone_sha256?.length, 1)
  assert.equal(event.referrer_url, 'https://utekos.no/produkter')

  const dataLayer = buildGenerateLeadDataLayerEvent(event)
  assert.equal(dataLayer.event, 'generate_lead')
  assert.equal(dataLayer.event_id, submissionId)
  assert.equal(
    event.journey_id,
    '11111111-1111-4111-8111-111111111111'
  )
  assert.equal(dataLayer.canonical_event.journey_id, undefined)
  const denied = normalizeCanonicalGenerateLead(
    {
      ...event,
      consent: { ...event.consent, analytics: 'denied' }
    },
    {}
  )
  assert.equal(denied.journey_id, undefined)
  assert.equal(denied.page_view_id, undefined)
})

test('parseLeadFormTrackingContext accepts valid payload and rejects invalid', () => {
  const formData = new FormData()
  formData.set(
    LEAD_TRACKING_CONTEXT_FIELD,
    JSON.stringify({
      consent: {
        analytics: 'granted',
        marketing: 'granted',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      },
      page_url: 'https://utekos.no/',
      page_view_id: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7'
    })
  )

  const parsed = parseLeadFormTrackingContext(
    formData.get(LEAD_TRACKING_CONTEXT_FIELD)
  )
  assert.ok(parsed)
  assert.equal(parsed?.consent.marketing, 'granted')

  assert.equal(
    parseLeadFormTrackingContext('{not-json'),
    undefined
  )
  assert.equal(
    parseLeadFormTrackingContext(
      JSON.stringify({ consent: { analytics: 'granted' } })
    ),
    undefined
  )
  assert.deepEqual(deniedCookiebotConsent().marketing, 'denied')
})

test('lead context drops linked identifiers without analytics even when marketing is granted', () => {
  const context = parseLeadFormTrackingContext(
    JSON.stringify({
      consent: {
        ...deniedCookiebotConsent(),
        marketing: 'granted'
      },
      page_url: 'https://utekos.no/produkter/utekos-dun',
      page_view_id: '22222222-2222-4222-8222-222222222222',
      journey_id: '11111111-1111-4111-8111-111111111111'
    })
  )
  assert.ok(context)
  assert.equal(context.page_view_id, undefined)
  assert.equal(context.journey_id, undefined)
})
