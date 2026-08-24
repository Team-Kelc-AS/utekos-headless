import assert from 'node:assert/strict'
import test from 'node:test'
import type { CanonicalPageView } from '../pageViewEvent'
import { mapCanonicalEventPersistence } from './mapCanonicalEventPersistence'

const event: CanonicalPageView = {
  schema_version: 1,
  event_name: 'page_view',
  event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
  page_view_id: 'e58460a4-5a60-450c-962a-7f22254c25dd',
  event_time: '2026-07-15T10:00:00.000Z',
  source: 'web',
  environment: 'test',
  page_url: 'https://utekos.no/produkter',
  page_title: 'Produkter',
  consent: {
    analytics: 'granted',
    marketing: 'granted',
    preferences: 'denied',
    source: 'cookiebot',
    version: '1'
  },
  external_id: 'customer-1',
  user_data: {
    facebook_login_id: '1234567890',
    email_sha256: [
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    ]
  }
}

test('maps one canonical ledger row with stable idempotency and quality metadata', () => {
  const result = mapCanonicalEventPersistence({
    event,
    dispatches: []
  })

  assert.deepEqual(result.ledger, {
    consent: event.consent,
    event_id: event.event_id,
    event_name: 'page_view',
    external_id: 'customer-1',
    idempotency_key:
      'page_view:61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    occurred_at: event.event_time,
    payload: event,
    source_url: event.page_url,
    user_data_quality: {
      email_sha256_count: 1,
      has_external_id: true,
      has_facebook_login_id: true,
      phone_sha256_count: 0
    }
  })
})

test('maps canonical Meta and Microsoft outbox rows without provider renaming', () => {
  const result = mapCanonicalEventPersistence({
    event,
    dispatches: [
      {
        dispatch_mode: 'server_retry',
        event_id: event.event_id,
        provider: 'meta'
      },
      {
        dispatch_mode: 'server_retry',
        event_id: event.event_id,
        provider: 'microsoft_uet'
      }
    ]
  })

  assert.deepEqual(
    result.dispatches.map(dispatch => ({
      consent_basis: dispatch.consent_basis,
      data_quality: dispatch.data_quality,
      dispatch_mode: dispatch.dispatch_mode,
      event_id: dispatch.event_id,
      event_name: dispatch.event_name,
      idempotency_key: dispatch.idempotency_key,
      payload: dispatch.payload,
      provider: dispatch.provider,
      status: dispatch.status
    })),
    ['meta', 'microsoft_uet'].map(provider => ({
      consent_basis: event.consent,
      data_quality: {
        email_sha256_count: 1,
        has_external_id: true,
        has_facebook_login_id: true,
        phone_sha256_count: 0
      },
      dispatch_mode: 'server_retry',
      event_id: event.event_id,
      event_name: 'page_view',
      idempotency_key:
        'page_view:61c2ef59-6e6f-4f56-a63a-567ca398f9de',
      payload: event,
      provider,
      status: 'pending'
    }))
  )
})

test('persists a non-qualified Google row without scheduling it', () => {
  const result = mapCanonicalEventPersistence({
    event,
    dispatches: [
      {
        dispatch_mode: 'server_retry',
        event_id: event.event_id,
        provider: 'google',
        skip_reason: 'missing_client_id',
        status: 'skipped_unqualified'
      }
    ]
  })

  assert.deepEqual(result.dispatches[0], {
    consent_basis: event.consent,
    data_quality: {
      email_sha256_count: 1,
      has_external_id: true,
      has_facebook_login_id: true,
      phone_sha256_count: 0
    },
    dispatch_mode: 'server_retry',
    event_id: event.event_id,
    event_name: 'page_view',
    idempotency_key:
      'page_view:61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    payload: event,
    provider: 'google',
    skip_reason: 'missing_client_id',
    status: 'skipped_unqualified'
  })
})

test('persists Google event freshness as provider data quality', () => {
  const result = mapCanonicalEventPersistence({
    event,
    dispatches: [
      {
        dispatch_mode: 'server_retry',
        event_id: event.event_id,
        google_event_freshness: 'late_within_window',
        provider: 'google'
      }
    ]
  })

  assert.deepEqual(result.dispatches[0]?.data_quality, {
    email_sha256_count: 1,
    google_event_freshness: 'late_within_window',
    has_external_id: true,
    has_facebook_login_id: true,
    phone_sha256_count: 0
  })
})
