import assert from 'node:assert/strict'
import test from 'node:test'
import {
  classifyLandingConsentDecision,
  createLandingConsentTransport,
  type LandingConsentObservation
} from '@/lib/analytics/landingConsentObservation'

const observation: LandingConsentObservation = {
  correlation_token:
    '1754029200.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq',
  edge_request_id: '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd',
  page_view_id: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
  consent: {
    analytics: 'granted',
    marketing: 'granted',
    preferences: 'granted',
    source: 'cookiebot',
    version: '1'
  }
}

test('a later reconciliation can recover after a failed burst without unlimited retries', async () => {
  let attempts = 0
  const transport = createLandingConsentTransport(
    async () => {
      attempts += 1
      if (attempts <= 3) throw new Error('temporary outage')
    },
    { waitBeforeRetry: async () => {} }
  )
  assert.equal(await transport.observe(observation), 'failed')
  assert.equal(attempts, 3)
  assert.equal(await transport.observe(observation), 'sent')
  assert.equal(await transport.observe(observation), 'skipped')
  assert.equal(attempts, 4)
})

test('classifies resolved consent decisions without a pending guess', () => {
  assert.equal(
    classifyLandingConsentDecision(observation.consent),
    'granted'
  )
  assert.equal(
    classifyLandingConsentDecision({
      ...observation.consent,
      analytics: 'granted',
      marketing: 'granted'
    }),
    'granted'
  )
})

test('retries a failed observation and deduplicates the acknowledged state', async () => {
  let attempts = 0
  const transport = createLandingConsentTransport(
    async () => {
      attempts += 1
      if (attempts === 1) throw new Error('temporary failure')
    },
    { waitBeforeRetry: async () => {} }
  )

  assert.equal(await transport.observe(observation), 'sent')
  assert.equal(await transport.observe(observation), 'skipped')
  assert.equal(attempts, 2)
})

test('bounds retries across repeated consent events', async () => {
  let attempts = 0
  const transport = createLandingConsentTransport(
    async () => {
      attempts += 1
      throw new Error('still unavailable')
    },
    { maximumAttempts: 2, waitBeforeRetry: async () => {} }
  )

  assert.equal(await transport.observe(observation), 'failed')
  assert.equal(await transport.observe(observation), 'failed')
  assert.equal(attempts, 2)
})

test('deduplicates the same granted state while the first observation retries', async () => {
  const calls: string[] = []
  let releaseRetry: (() => void) | undefined
  const retryGate = new Promise<void>(resolve => {
    releaseRetry = resolve
  })
  let grantedAttempts = 0
  const transport = createLandingConsentTransport(
    async value => {
      calls.push(value.consent.marketing)
      if (
        value.consent.marketing === 'granted' &&
        grantedAttempts++ === 0
      ) {
        throw new Error('temporary failure')
      }
    },
    { waitBeforeRetry: () => retryGate }
  )
  const granted = {
    ...observation,
    consent: {
      ...observation.consent,
      analytics: 'granted' as const,
      marketing: 'granted' as const,
      preferences: 'granted' as const
    }
  }
  const repeated = {
    ...observation,
    consent: {
      ...observation.consent,
      analytics: 'granted' as const,
      marketing: 'granted' as const,
      preferences: 'granted' as const
    }
  }

  const grantedResult = transport.observe(granted)
  await Promise.resolve()
  const repeatedResult = transport.observe(repeated)
  await Promise.resolve()
  assert.deepEqual(calls, ['granted'])

  releaseRetry?.()

  assert.equal(await grantedResult, 'sent')
  assert.equal(await repeatedResult, 'skipped')
  assert.deepEqual(calls, ['granted', 'granted'])
})
