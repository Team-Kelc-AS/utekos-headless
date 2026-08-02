import assert from 'node:assert/strict'
import test from 'node:test'
import {
  classifyLandingConsentDecision,
  createLandingConsentTransport,
  type LandingConsentObservation
} from './landingConsentObservation'

const observation: LandingConsentObservation = {
  correlation_token:
    '1754029200.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq',
  edge_request_id: '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd',
  page_view_id: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
  consent: {
    analytics: 'granted',
    marketing: 'granted',
    preferences: 'denied',
    source: 'cookiebot',
    version: '1'
  }
}

test('classifies resolved Cookiebot decisions without a pending guess', () => {
  assert.equal(
    classifyLandingConsentDecision(observation.consent),
    'partial'
  )
  assert.equal(
    classifyLandingConsentDecision({
      ...observation.consent,
      analytics: 'denied',
      marketing: 'denied'
    }),
    'denied'
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

test('serializes a newer consent state behind retries for the same landing', async () => {
  const calls: string[] = []
  let releaseRetry: (() => void) | undefined
  const retryGate = new Promise<void>(resolve => {
    releaseRetry = resolve
  })
  let deniedAttempts = 0
  const transport = createLandingConsentTransport(
    async value => {
      calls.push(value.consent.marketing)
      if (
        value.consent.marketing === 'denied' &&
        deniedAttempts++ === 0
      ) {
        throw new Error('temporary failure')
      }
    },
    { waitBeforeRetry: () => retryGate }
  )
  const denied = {
    ...observation,
    consent: {
      ...observation.consent,
      analytics: 'denied' as const,
      marketing: 'denied' as const,
      preferences: 'denied' as const
    }
  }
  const granted = {
    ...observation,
    consent: {
      ...observation.consent,
      analytics: 'granted' as const,
      marketing: 'granted' as const,
      preferences: 'granted' as const
    }
  }

  const deniedResult = transport.observe(denied)
  await Promise.resolve()
  const grantedResult = transport.observe(granted)
  await Promise.resolve()
  assert.deepEqual(calls, ['denied'])

  releaseRetry?.()

  assert.equal(await deniedResult, 'sent')
  assert.equal(await grantedResult, 'sent')
  assert.deepEqual(calls, ['denied', 'denied', 'granted'])
})
