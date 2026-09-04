import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'

import {
  handleMetaCatalogWebhookEvent,
  handleMetaCatalogWebhookVerification,
  type MetaCatalogWebhookDependencies
} from './route'

function dependencies(
  log: MetaCatalogWebhookDependencies['log'] = () => undefined
): MetaCatalogWebhookDependencies {
  return {
    getAppSecret: () => 'app-secret',
    getVerifyToken: () => 'verify-token',
    log
  }
}

function signature(payload: string) {
  return `sha256=${createHmac('sha256', 'app-secret').update(payload).digest('hex')}`
}

test('returns the webhook challenge for the exact verify token', async () => {
  const request = new Request(
    'https://utekos.no/api/webhooks/meta/catalog?hub.mode=subscribe&hub.verify_token=verify-token&hub.challenge=challenge-123'
  )
  const response = handleMetaCatalogWebhookVerification(
    request,
    dependencies()
  )

  assert.equal(response.status, 200)
  assert.equal(await response.text(), 'challenge-123')
})

test('rejects an invalid webhook verify token', () => {
  const request = new Request(
    'https://utekos.no/api/webhooks/meta/catalog?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=challenge-123'
  )

  assert.equal(
    handleMetaCatalogWebhookVerification(
      request,
      dependencies()
    ).status,
    403
  )
})

test('accepts signed catalog events and logs only a summary', async () => {
  const summaries: unknown[] = []
  const payload = JSON.stringify({
    object: 'catalog',
    entry: [
      {
        id: '690208780604782',
        time: 1788530000,
        changes: [
          { field: 'items_batch', value: { handle: 'sensitive' } },
          { field: 'product_feed', value: { id: 'feed' } }
        ]
      }
    ]
  })
  const request = new Request(
    'https://utekos.no/api/webhooks/meta/catalog',
    {
      method: 'POST',
      headers: { 'x-hub-signature-256': signature(payload) },
      body: payload
    }
  )
  const response = await handleMetaCatalogWebhookEvent(
    request,
    dependencies(summary => summaries.push(summary))
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { received: true })
  assert.deepEqual(summaries, [
    {
      catalogIds: ['690208780604782'],
      entryCount: 1,
      changeCount: 2,
      fields: ['items_batch', 'product_feed']
    }
  ])
})

test('rejects unsigned events before parsing', async () => {
  const response = await handleMetaCatalogWebhookEvent(
    new Request('https://utekos.no/api/webhooks/meta/catalog', {
      method: 'POST',
      body: '{}'
    }),
    dependencies()
  )

  assert.equal(response.status, 401)
})

test('rejects signed malformed JSON', async () => {
  const payload = '{'
  const response = await handleMetaCatalogWebhookEvent(
    new Request('https://utekos.no/api/webhooks/meta/catalog', {
      method: 'POST',
      headers: { 'x-hub-signature-256': signature(payload) },
      body: payload
    }),
    dependencies()
  )

  assert.equal(response.status, 400)
})
