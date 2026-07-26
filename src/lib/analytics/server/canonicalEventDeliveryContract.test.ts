import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildViewItemDataLayerEvent,
  canonicalViewItemSchema,
  createCanonicalViewItem
} from '../viewItemEvent'
import { createCanonicalEventStore } from './createCanonicalEventStore'
import { createProviderOutboxStore } from './createProviderOutboxStore'
import { mapCanonicalViewItemToGoogleDataManager } from './mapCanonicalViewItemToGoogleDataManager'
import { mapCanonicalViewItemToMeta } from './mapCanonicalViewItemToMeta'
import type {
  ProviderAdapter,
  ProviderId
} from './providerAdapter'
import type { ProviderOutboxDatabase } from './providerOutboxTypes'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'
import { runProviderOutboxWorker } from './runProviderOutboxWorker'

function viewItem() {
  return createCanonicalViewItem({
    commerce: {
      currency: 'NOK',
      gross_value: 125,
      tax_value: 25,
      value: 100,
      items: [
        {
          available_for_sale: true,
          collection_ids: [],
          collection_titles: [],
          currently_not_in_stock: false,
          gross_unit_price: 125,
          item_id: 'gid://shopify/ProductVariant/1',
          item_name: 'Utekos TechDown',
          price_includes_tax: true,
          product_handle: 'utekos-techdown',
          product_id: 'product-1',
          quantity: 1,
          quantity_available: 10,
          selected_options: [],
          tax_amount: 25,
          tax_rate: 0.25,
          taxable: true,
          unit_price: 100,
          variant_id: 'gid://shopify/ProductVariant/1'
        }
      ]
    },
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    browserId: { ga_client_id: '123456789.1784201643' },
    environment: 'test',
    eventId: 'c3289453-e760-43ab-aaf5-10c3d233843a',
    eventTime: '2026-07-17T12:00:00.000Z',
    pageTitle: 'Utekos TechDown',
    pageUrl: 'https://utekos.no/produkter/utekos-techdown',
    pageViewId: '2c9f5da1-1f51-41b7-9734-e9af6a40a134'
  })
}

test('one canonical event_id creates one row and one stable provider dedupe key per route', async () => {
  const event = viewItem()
  const ledgerKeys = new Set<string>()
  const dispatchRows: Array<{ key: string; payload: unknown }> =
    []
  const store = createCanonicalEventStore(work =>
    work({
      insertLedger: async row => {
        if (ledgerKeys.has(row.idempotency_key)) return false
        ledgerKeys.add(row.idempotency_key)
        return true
      },
      upsertSourceEvidence: async () => {},
      insertDispatch: async row => {
        dispatchRows.push({
          key: `${row.provider}:${row.idempotency_key}`,
          payload: row.payload
        })
        return `00000000-0000-4000-8000-00000000000${dispatchRows.length}`
      }
    })
  )
  const input = {
    dispatches: planCanonicalEventDispatch(event),
    event
  }

  const acceptResults = await Promise.all([
    store.accept(input),
    store.accept(input)
  ])

  assert.deepEqual(acceptResults.map(result => result.status).sort(), [
    'duplicate',
    'inserted'
  ])
  assert.equal(
    acceptResults.reduce(
      (sum, result) => sum + result.createdDispatchAttempts.length,
      0
    ),
    2
  )
  assert.equal(ledgerKeys.size, 1)
  assert.equal(dispatchRows.length, 2)
  assert.deepEqual(
    dispatchRows.map(row => row.key),
    [
      `google:view_item:${event.event_id}`,
      `meta:view_item:${event.event_id}`
    ]
  )

  const browserEvent = buildViewItemDataLayerEvent(event)
  const googleEvent =
    mapCanonicalViewItemToGoogleDataManager(event)
  const metaEvent = mapCanonicalViewItemToMeta(
    event
  ).normalize() as { event_id: string }

  assert.equal(browserEvent.transaction_id, event.event_id)
  assert.equal(googleEvent.transactionId, event.event_id)
  assert.equal(metaEvent.event_id, event.event_id)

  const providerResults = await Promise.all(
    (['google', 'meta'] as const).map(async provider => {
      let accepted = false
      let processing = false
      let dispatchCalls = 0
      const acceptedEventIds: string[] = []
      const database: ProviderOutboxDatabase<{
        eventId: string
      }> = {
        claimNext: async () => {
          if (accepted || processing) return null
          processing = true
          return {
            attemptCount: 1,
            attemptId:
              provider === 'google' ?
                'f34daf5e-4c04-45b4-a802-273cbfe96f95'
              : 'fab11b4e-6a6c-4f6c-8f35-b889231f1db7',
            payload: dispatchRows.find(
              row =>
                row.key ===
                `${provider}:view_item:${event.event_id}`
            )?.payload
          }
        },
        markAcceptedUnverified: async outcome => {
          processing = false
          accepted = true
          acceptedEventIds.push(outcome.receipt.eventId)
        },
        markDeadLettered: async () => {
          throw new Error('unexpected dead letter')
        },
        markInvalidPayload: async () => {
          throw new Error('unexpected invalid payload')
        },
        markRetryScheduled: async () => {
          throw new Error('unexpected retry')
        }
      }
      const adapter: ProviderAdapter<
        typeof event,
        { eventId: string }
      > = {
        deadLetterReasons: {
          attemptsExhausted: 'attempts_exhausted',
          invalidPayload: 'invalid_payload',
          permanentError: 'permanent_error'
        },
        dispatch: async currentEvent => {
          dispatchCalls += 1
          return { eventId: currentEvent.event_id }
        },
        eventName: 'view_item',
        isRetryable: () => false,
        key: `${provider}:view_item`,
        projectReceipt: receipt => ({
          requestId: null,
          response: receipt,
          validationResult: {}
        }),
        provider: provider satisfies ProviderId,
        retryPolicy: {
          delaysMs: [],
          maxAttempts: 1,
          positiveJitterRatio: 0
        },
        schema: canonicalViewItemSchema,
        summarizeError: String
      }
      const outboxStore = createProviderOutboxStore(
        adapter,
        database
      )
      const workers = await Promise.all([
        runProviderOutboxWorker(
          { maxItems: 1 },
          { adapter, store: outboxStore }
        ),
        runProviderOutboxWorker(
          { maxItems: 1 },
          { adapter, store: outboxStore }
        )
      ])

      return {
        acceptedEventIds,
        dispatchCalls,
        provider,
        totalClaims: workers.reduce(
          (sum, worker) => sum + worker.claimed,
          0
        )
      }
    })
  )

  assert.deepEqual(providerResults, [
    {
      acceptedEventIds: [event.event_id],
      dispatchCalls: 1,
      provider: 'google',
      totalClaims: 1
    },
    {
      acceptedEventIds: [event.event_id],
      dispatchCalls: 1,
      provider: 'meta',
      totalClaims: 1
    }
  ])
})
