import assert from 'node:assert/strict'
import test from 'node:test'
import type { CanonicalPageViewStoreInput } from './acceptCanonicalPageView'
import {
  createCanonicalPageViewStore,
  type CanonicalPageViewTransaction
} from './createCanonicalPageViewStore'

function input(): CanonicalPageViewStoreInput {
  return {
    event: {
      schema_version: 1,
      event_name: 'page_view',
      event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
      page_view_id: 'e58460a4-5a60-450c-962a-7f22254c25dd',
      event_time: '2026-07-15T10:00:00.000Z',
      source: 'web',
      environment: 'test',
      page_url: 'https://utekos.no/',
      page_title: 'Utekos',
      consent: {
        analytics: 'granted',
        marketing: 'granted',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      }
    },
    dispatches: [
      {
        dispatch_mode: 'server_retry',
        event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
        provider: 'meta'
      },
      {
        dispatch_mode: 'server_retry',
        event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
        provider: 'microsoft_uet'
      }
    ]
  }
}

test('writes the ledger and every dispatch inside one transaction callback', async () => {
  const calls: string[] = []
  let transactions = 0
  const transaction: CanonicalPageViewTransaction = {
    insertLedger: async () => {
      calls.push('ledger')
      return true
    },
    upsertSourceEvidence: async () => {
      throw new Error('unexpected source evidence')
    },
    insertDispatch: async dispatch => {
      calls.push(dispatch.provider)
      return `00000000-0000-4000-8000-00000000000${calls.length}`
    }
  }
  const store = createCanonicalPageViewStore(async work => {
    transactions += 1
    return work(transaction)
  })

  const result = await store.accept(input())

  assert.equal(result.status, 'inserted')
  assert.equal(result.createdDispatchAttempts.length, 2)
  assert.equal(transactions, 1)
  assert.deepEqual(calls, ['ledger', 'meta', 'microsoft_uet'])
})

test('records source evidence but returns duplicate without writing dispatches when the ledger conflicts', async () => {
  let dispatchWrites = 0
  let evidenceWrites = 0
  const transaction: CanonicalPageViewTransaction = {
    insertLedger: async () => false,
    upsertSourceEvidence: async evidence => {
      evidenceWrites += 1
      assert.equal(
        evidence.canonical_event_id,
        input().event.event_id
      )
    },
    insertDispatch: async () => {
      dispatchWrites += 1
      return '00000000-0000-4000-8000-000000000001'
    }
  }
  const store = createCanonicalPageViewStore(work =>
    work(transaction)
  )

  const eventInput = input()
  const result = await store.accept({
    ...eventInput,
    sourceEvidence: {
      canonical_event_id: eventInput.event.event_id,
      source_system: 'shopify',
      source_method: 'webhook',
      source_object_type: 'order',
      source_object_id: '12345',
      source_topic: 'orders/paid',
      source_delivery_id: 'delivery-1',
      source_event_id: 'event-1',
      source_api_version: '2026-04',
      source_triggered_at: '2026-07-15T10:00:00.000Z',
      source_observed_at: '2026-07-15T10:00:01.000Z'
    }
  })

  assert.deepEqual(result, {
    createdDispatchAttempts: [],
    status: 'duplicate'
  })
  assert.equal(evidenceWrites, 1)
  assert.equal(dispatchWrites, 0)
})

test('returns only newly inserted pending attempts for queue publication', async () => {
  const transaction: CanonicalPageViewTransaction = {
    insertLedger: async () => true,
    upsertSourceEvidence: async () => {},
    insertDispatch: async dispatch =>
      dispatch.provider === 'meta' ?
        '7bcd24a4-190c-4eca-a834-5c9854bd54ea'
      : '3387a158-165f-498e-a968-d75b833f86fb'
  }
  const store = createCanonicalPageViewStore(work =>
    work(transaction)
  )
  const eventInput = input()

  const result = await store.accept({
    ...eventInput,
    dispatches: [
      eventInput.dispatches[0]!,
      {
        ...eventInput.dispatches[1]!,
        skip_reason: 'missing_msclkid',
        status: 'skipped_unqualified'
      }
    ]
  })

  assert.deepEqual(result.createdDispatchAttempts, [
    {
      adapterKey: 'meta:page_view',
      attemptId: '7bcd24a4-190c-4eca-a834-5c9854bd54ea'
    }
  ])
})

test('writes ledger, source evidence and dispatches in one transaction callback', async () => {
  const calls: string[] = []
  const eventInput = input()
  const transaction: CanonicalPageViewTransaction = {
    insertLedger: async () => {
      calls.push('ledger')
      return true
    },
    upsertSourceEvidence: async evidence => {
      calls.push('source-evidence')
      assert.equal(
        evidence.canonical_event_id,
        eventInput.event.event_id
      )
    },
    insertDispatch: async dispatch => {
      calls.push(dispatch.provider)
      return `00000000-0000-4000-8000-00000000000${calls.length}`
    }
  }
  const store = createCanonicalPageViewStore(work =>
    work(transaction)
  )

  const result = await store.accept({
    ...eventInput,
    sourceEvidence: {
      canonical_event_id: eventInput.event.event_id,
      source_system: 'shopify',
      source_method: 'webhook',
      source_object_type: 'order',
      source_object_id: '12345',
      source_topic: 'orders/paid',
      source_delivery_id: 'delivery-1',
      source_event_id: 'event-1',
      source_api_version: '2026-04',
      source_triggered_at: '2026-07-15T10:00:00.000Z',
      source_observed_at: '2026-07-15T10:00:01.000Z'
    }
  })

  assert.equal(result.status, 'inserted')
  assert.deepEqual(calls, [
    'ledger',
    'source-evidence',
    'meta',
    'microsoft_uet'
  ])
})

test('rejects mismatched source evidence before any transaction write', async () => {
  let writes = 0
  const transaction: CanonicalPageViewTransaction = {
    insertLedger: async () => {
      writes += 1
      return true
    },
    upsertSourceEvidence: async () => {
      writes += 1
    },
    insertDispatch: async () => {
      writes += 1
      return '00000000-0000-4000-8000-000000000001'
    }
  }
  const store = createCanonicalPageViewStore(work =>
    work(transaction)
  )
  const eventInput = input()

  await assert.rejects(
    store.accept({
      ...eventInput,
      sourceEvidence: {
        canonical_event_id:
          '69b1f87e-a1a8-4b76-a849-7feeb636c919',
        source_system: 'shopify',
        source_method: 'webhook',
        source_object_type: 'order',
        source_object_id: '12345',
        source_topic: 'orders/paid',
        source_delivery_id: 'delivery-1',
        source_event_id: 'event-1',
        source_api_version: '2026-04',
        source_triggered_at: '2026-07-15T10:00:00.000Z',
        source_observed_at: '2026-07-15T10:00:01.000Z'
      }
    }),
    /source_evidence_event_id_mismatch/
  )
  assert.equal(writes, 0)
})
