import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import {
  classifyBrowserEventTraffic,
  SYNTHETIC_SIGNATURE_HEADER,
  SYNTHETIC_TIMESTAMP_HEADER,
  syntheticSignaturePayload,
  type BrowserEventTrafficDependencies
} from './classifyBrowserEventTraffic'

const nowSeconds = 1_785_564_800

function dependencies(
  overrides: Partial<BrowserEventTrafficDependencies> = {}
): BrowserEventTrafficDependencies {
  return {
    checkBot: async () => ({
      bypassed: false,
      isBot: false,
      isHuman: true,
      isVerifiedBot: false
    }),
    environment: {},
    nowSeconds: () => nowSeconds,
    ...overrides
  }
}

function signedSyntheticRequest(timestamp = String(nowSeconds)) {
  const secret = 'test-synthetic-secret'
  const unsigned = new Request(
    'https://utekos.no/api/events/page-view',
    { method: 'POST' }
  )
  const signature = createHmac('sha256', secret)
    .update(syntheticSignaturePayload(unsigned, timestamp))
    .digest('hex')

  return {
    request: new Request(unsigned, {
      headers: {
        [SYNTHETIC_SIGNATURE_HEADER]: signature,
        [SYNTHETIC_TIMESTAMP_HEADER]: timestamp
      }
    }),
    environment: {
      UTEKOS_SYNTHETIC_TRAFFIC_SECRET: secret
    }
  }
}

test('excludes a signed synthetic browser collector request', async () => {
  const { request, environment } =
    signedSyntheticRequest()
  let botChecks = 0

  const verdict = await classifyBrowserEventTraffic(
    request,
    dependencies({
      checkBot: async () => {
        botChecks += 1
        return {
          bypassed: false,
          isBot: false,
          isHuman: true,
          isVerifiedBot: false
        }
      },
      environment
    })
  )

  assert.deepEqual(verdict, {
    classification: 'synthetic',
    excludeFromMarketingDispatch: true
  })
  assert.equal(botChecks, 0)
})

test('rejects a stale synthetic signature and checks BotID', async () => {
  const { request, environment } = signedSyntheticRequest(
    String(nowSeconds - 301)
  )
  let botChecks = 0

  const verdict = await classifyBrowserEventTraffic(
    request,
    dependencies({
      checkBot: async () => {
        botChecks += 1
        return {
          bypassed: false,
          isBot: false,
          isHuman: true,
          isVerifiedBot: false
        }
      },
      environment
    })
  )

  assert.equal(botChecks, 1)
  assert.equal(verdict.excludeFromMarketingDispatch, false)
})

test('excludes verified and automated BotID traffic', async () => {
  const request = new Request(
    'https://utekos.no/api/events/page-view',
    { method: 'POST' }
  )
  const verified = await classifyBrowserEventTraffic(
    request,
    dependencies({
      checkBot: async () => ({
        bypassed: false,
        isBot: true,
        isHuman: false,
        isVerifiedBot: true
      })
    })
  )
  const automated = await classifyBrowserEventTraffic(
    request,
    dependencies({
      checkBot: async () => ({
        bypassed: false,
        isBot: true,
        isHuman: false,
        isVerifiedBot: false
      })
    })
  )

  assert.equal(verified.classification, 'verified_bot')
  assert.equal(verified.excludeFromMarketingDispatch, true)
  assert.equal(automated.classification, 'automated_bot')
  assert.equal(automated.excludeFromMarketingDispatch, true)
})

test('fails open when BotID is unavailable', async () => {
  const request = new Request(
    'https://utekos.no/api/events/page-view',
    { method: 'POST' }
  )
  const originalError = console.error
  console.error = () => {}

  try {
    const verdict = await classifyBrowserEventTraffic(
      request,
      dependencies({
        checkBot: async () => {
          throw new Error('BotID unavailable')
        }
      })
    )

    assert.deepEqual(verdict, {
      classification: 'human_or_unknown',
      excludeFromMarketingDispatch: false
    })
  } finally {
    console.error = originalError
  }
})
