import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canonicalEventSourceEvidenceSchema,
  mapCanonicalEventSourceEvidencePersistence
} from '@/lib/analytics/server/canonicalEventSourceEvidence'

const canonicalEventId = 'c4cd5f26-2d76-4f40-a77a-43ee31f3318b'

function sourceEvidence() {
  return {
    canonical_event_id: canonicalEventId,
    source_system: 'shopify',
    source_method: 'webhook',
    source_object_type: 'order',
    source_object_id: '12345',
    source_topic: 'orders/paid',
    source_delivery_id: 'delivery-1',
    source_event_id: 'event-1',
    source_api_version: '2026-04',
    source_triggered_at: '2026-07-21T20:00:00.000Z',
    source_observed_at: '2026-07-21T20:00:01.000Z'
  }
}

test('strict provider-neutral source evidence maps to canonical ledger identity', () => {
  const row = mapCanonicalEventSourceEvidencePersistence({
    event: {
      event_id: canonicalEventId,
      event_name: 'purchase'
    },
    sourceEvidence: sourceEvidence()
  })

  assert.deepEqual(row, {
    ...sourceEvidence(),
    canonical_event_name: 'purchase',
    canonical_idempotency_key: `purchase:${canonicalEventId}`,
    observation_key: 'shopify:webhook:delivery:delivery-1'
  })
})

test('source evidence rejects payloads, secrets, HMAC and customer PII fields', () => {
  for (const forbiddenField of [
    'raw_payload',
    'secret',
    'hmac',
    'email',
    'phone'
  ]) {
    const result = canonicalEventSourceEvidenceSchema.safeParse({
      ...sourceEvidence(),
      [forbiddenField]: 'forbidden'
    })

    assert.equal(result.success, false, forbiddenField)
  }
})

test('source evidence fails closed when its event id differs from the canonical event', () => {
  assert.throws(
    () =>
      mapCanonicalEventSourceEvidencePersistence({
        event: {
          event_id: 'cb493da9-3c94-4b83-81d8-6aa8d22f16d6',
          event_name: 'purchase'
        },
        sourceEvidence: sourceEvidence()
      }),
    /source_evidence_event_id_mismatch/
  )
})

test('reconciliation evidence has a stable observation key without fabricated delivery ids', () => {
  const evidence = {
    ...sourceEvidence(),
    source_method: 'reconciliation',
    source_delivery_id: null,
    source_event_id: null
  }
  const row = mapCanonicalEventSourceEvidencePersistence({
    event: {
      event_id: canonicalEventId,
      event_name: 'purchase'
    },
    sourceEvidence: evidence
  })

  assert.equal(
    row.observation_key,
    `shopify:reconciliation:order:12345:orders/paid:2026-04:${canonicalEventId}`
  )
  assert.equal(row.source_delivery_id, null)
  assert.equal(row.source_event_id, null)
})
