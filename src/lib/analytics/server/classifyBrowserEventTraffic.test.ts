import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import {
  createLandingEdgeCorrelationToken,
  LANDING_EDGE_CORRELATION_TOKEN_MAX_AGE_SECONDS
} from '../landingEdgeCorrelationToken'
import { LANDING_SYNTHETIC_CORRELATION_COOKIE_NAME } from '../landingEdgeCorrelation'
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

test('excludes a browser request carrying a server-signed synthetic correlation', async () => {
  const secret = 'landing-observability-test-secret-value'
  const edgeRequestId =
    '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd'
  const token = await createLandingEdgeCorrelationToken({
    edgeRequestId,
    issuedAtSeconds: nowSeconds,
    secret
  })
  let botChecks = 0
  const request = new Request(
    'https://utekos.no/api/events/page-view',
    {
      headers: {
        cookie: `${LANDING_SYNTHETIC_CORRELATION_COOKIE_NAME}=${edgeRequestId}.${token}`
      },
      method: 'POST'
    }
  )

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
      environment: {
        LANDING_OBSERVABILITY_SIGNING_SECRET: secret
      }
    })
  )

  assert.deepEqual(verdict, {
    classification: 'synthetic',
    excludeFromMarketingDispatch: true
  })
  assert.equal(botChecks, 0)
})

test('does not trust an expired synthetic correlation cookie', async () => {
  const secret = 'landing-observability-test-secret-value'
  const edgeRequestId =
    '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd'
  const token = await createLandingEdgeCorrelationToken({
    edgeRequestId,
    issuedAtSeconds:
      nowSeconds -
      LANDING_EDGE_CORRELATION_TOKEN_MAX_AGE_SECONDS -
      1,
    secret
  })
  let botChecks = 0
  const request = new Request(
    'https://utekos.no/api/events/page-view',
    {
      headers: {
        cookie: `${LANDING_SYNTHETIC_CORRELATION_COOKIE_NAME}=${edgeRequestId}.${token}`
      },
      method: 'POST'
    }
  )

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
      environment: {
        LANDING_OBSERVABILITY_SIGNING_SECRET: secret
      }
    })
  )

  assert.equal(verdict.classification, 'human_or_unknown')
  assert.equal(botChecks, 1)
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
