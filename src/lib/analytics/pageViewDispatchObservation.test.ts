import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createPageViewDispatchObservationTransport,
  type PageViewDispatchObservation
} from './pageViewDispatchObservation'

const observation: PageViewDispatchObservation = {
  correlation_token:
    '1754029200.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq',
  edge_request_id: '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd',
  event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
  event_name: 'page_view',
  page_view_id: 'e58460a4-5a60-450c-962a-7f22254c25dd'
}

test('sends one privacy-bounded dispatch observation per event', async () => {
  const sent: PageViewDispatchObservation[] = []
  const transport = createPageViewDispatchObservationTransport(
    async value => {
      sent.push(value)
    }
  )

  assert.equal(await transport.observe(observation), 'sent')
  assert.equal(await transport.observe(observation), 'skipped')
  assert.deepEqual(sent, [observation])
})

test('retries transient failures without another collector flush', async () => {
  let attempts = 0
  const transport = createPageViewDispatchObservationTransport(
    async () => {
      attempts += 1
      if (attempts === 1) throw new Error('unavailable')
    },
    { waitBeforeRetry: async () => undefined }
  )

  assert.equal(await transport.observe(observation), 'sent')
  assert.equal(attempts, 2)
})

test('allows a later retry after all bounded attempts fail', async () => {
  let unavailable = true
  let attempts = 0
  const transport = createPageViewDispatchObservationTransport(
    async () => {
      attempts += 1
      if (unavailable) throw new Error('unavailable')
    },
    { maxAttempts: 2, waitBeforeRetry: async () => undefined }
  )

  assert.equal(await transport.observe(observation), 'failed')
  unavailable = false
  assert.equal(await transport.observe(observation), 'sent')
  assert.equal(attempts, 3)
})

test('rejects fields outside the bounded receipt contract', async () => {
  const transport = createPageViewDispatchObservationTransport(
    async () => undefined
  )

  await assert.rejects(
    transport.observe({
      ...observation,
      page_url: 'https://utekos.no/?fbclid=raw'
    } as PageViewDispatchObservation)
  )
})
