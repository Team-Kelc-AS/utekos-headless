import assert from 'node:assert/strict'
import test from 'node:test'
import { createCanonicalViewCategory } from '../viewCategoryEvent'
import {
  evaluateProviderDispatchHealth,
  runProviderDispatchHealthCheck,
  type ProviderDispatchHealthSnapshot
} from './providerDispatchHealth'

function viewCategory(marketing: 'denied' | 'granted') {
  return createCanonicalViewCategory({
    environment: 'test',
    eventId:
      marketing === 'granted' ?
        '61c2ef59-6e6f-4f56-a63a-567ca398f9de'
      : '04d31dbe-163b-45bf-a8f3-24d58ee801fe',
    eventTime: '2026-07-26T10:00:00.000Z',
    pageUrl: 'https://utekos.no/produkter',
    pageTitle: 'Alle produkter',
    pageViewId: 'e58460a4-5a60-450c-962a-7f22254c25dd',
    consent: {
      analytics: marketing,
      marketing,
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    customData: {
      category_id: 'all_products',
      category_name: 'Alle produkter',
      view_sequence: 1
    }
  })
}

function unhealthySnapshot(): ProviderDispatchHealthSnapshot {
  const eligibleEvent = viewCategory('granted')
  const deniedEvent = viewCategory('denied')

  return {
    ackSampleSize: 12,
    ledgerCandidates: [
      {
        eventId: eligibleEvent.event_id,
        eventName: eligibleEvent.event_name,
        payload: eligibleEvent,
        providers: ['google']
      },
      {
        eventId: deniedEvent.event_id,
        eventName: deniedEvent.event_name,
        payload: deniedEvent,
        providers: []
      },
      {
        eventId: 'invalid-event-id',
        eventName: 'view_category',
        payload: { event_name: 'view_category' },
        providers: []
      }
    ],
    p95AckLatencyMs: 61_000,
    problemAttempts: [
      {
        attemptId: '7bcd24a4-190c-4eca-a834-5c9854bd54ea',
        eventId: eligibleEvent.event_id,
        eventName: eligibleEvent.event_name,
        issueCode: 'initial_pending_over_two_minutes',
        provider: 'meta'
      },
      {
        attemptId: '3387a158-165f-498e-a968-d75b833f86fb',
        eventId: eligibleEvent.event_id,
        eventName: eligibleEvent.event_name,
        issueCode: 'dead_lettered',
        provider: 'meta'
      }
    ]
  }
}

test('finds missing attempts only for consent-qualified providers', () => {
  const evaluation = evaluateProviderDispatchHealth(
    unhealthySnapshot()
  )

  assert.deepEqual(evaluation.missingProviderAttempts, [
    {
      adapterKey: 'meta:view_category',
      eventId: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
      eventName: 'view_category'
    }
  ])
  assert.equal(evaluation.invalidLedgerEvents.length, 1)
  assert.equal(evaluation.initialPendingOverTwoMinutes.length, 1)
  assert.equal(evaluation.deadLettered.length, 1)
  assert.equal(evaluation.healthy, false)
})

test('emits one stable Sentry issue per failed health gate', async () => {
  const messages: string[] = []
  const result = await runProviderDispatchHealthCheck({
    captureMessage: message => {
      messages.push(message)
      return 'event-id'
    },
    store: { readSnapshot: async () => unhealthySnapshot() }
  })

  assert.equal(result.healthy, false)
  assert.deepEqual(messages, [
    'Canonical provider dispatch health: missing_provider_attempt',
    'Canonical provider dispatch health: invalid_canonical_ledger_payload',
    'Canonical provider dispatch health: initial_pending_over_two_minutes',
    'Canonical provider dispatch health: dead_lettered',
    'Canonical provider dispatch health: p95_ack_latency_over_60_seconds'
  ])
})

test('does not alert merely because no low-volume event occurred', async () => {
  const messages: string[] = []
  const result = await runProviderDispatchHealthCheck({
    captureMessage: message => {
      messages.push(message)
      return 'event-id'
    },
    store: {
      readSnapshot: async () => ({
        ackSampleSize: 0,
        ledgerCandidates: [],
        p95AckLatencyMs: null,
        problemAttempts: []
      })
    }
  })

  assert.equal(result.healthy, true)
  assert.deepEqual(messages, [])
})
