import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { shopifyCheckoutObservationSchema } from '../shopifyCheckoutObservationContract'
import { ShopifyCheckoutObservationFileStore } from './shopifyCheckoutObservationFileStore'

const observation = shopifyCheckoutObservationSchema.parse({
  contract: 'utekos.shopify.checkout_observation',
  schemaVersion: 1,
  source: 'shopify_app_web_pixel',
  verificationStatus: 'observed',
  eventId: 'shopify-event-1',
  eventName: 'payment_info_submitted',
  eventSequence: 8,
  occurredAt: '2026-08-03T10:00:00.000Z',
  checkoutToken: 'checkout-token',
  commerce: {
    currencyCode: 'NOK',
    value: 1790,
    itemQuantity: 1
  },
  privacy: {
    analyticsProcessingAllowed: true,
    marketingAllowed: false,
    preferencesProcessingAllowed: false,
    saleOfDataAllowed: false
  }
})

test('stores observations outside canonical ledger and detects replay conflicts', async t => {
  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), 'utekos-checkout-observations-')
  )
  t.after(() =>
    rm(temporaryDirectory, { recursive: true, force: true })
  )
  const filePath = join(temporaryDirectory, 'observations.json')
  const store = new ShopifyCheckoutObservationFileStore(
    filePath,
    () => new Date('2026-08-03T10:01:00.000Z')
  )

  assert.deepEqual(await store.persist(observation), {
    status: 'inserted',
    observationCount: 1
  })
  assert.deepEqual(await store.persist(observation), {
    status: 'duplicate',
    observationCount: 2
  })
  assert.deepEqual(
    await store.persist({
      ...observation,
      eventSequence: observation.eventSequence + 1
    }),
    { status: 'conflict', observationCount: 2 }
  )

  const storedFile = JSON.parse(await readFile(filePath, 'utf8'))
  assert.equal(storedFile.storeVersion, 1)
  assert.equal(storedFile.records.length, 1)
  assert.equal(storedFile.records[0].observationCount, 2)
  assert.equal(
    storedFile.records[0].observation.verificationStatus,
    'observed'
  )
  assert.equal(
    'canonicalEventName' in storedFile.records[0],
    false
  )
  assert.equal('provider' in storedFile.records[0], false)
  assert.equal('outbox' in storedFile.records[0], false)
})
