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

  const verdict = await classifyBrowserEventTraffic(
    request,
    dependencies({ environment })
  )

  assert.deepEqual(verdict, {
    classification: 'synthetic',
    excludeFromMarketingDispatch: true
  })
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
      environment: {
        LANDING_OBSERVABILITY_SIGNING_SECRET: secret
      }
    })
  )

  assert.deepEqual(verdict, {
    classification: 'synthetic',
    excludeFromMarketingDispatch: true
  })
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
      environment: {
        LANDING_OBSERVABILITY_SIGNING_SECRET: secret
      }
    })
  )

  assert.equal(verdict.classification, 'human_or_unknown')
})

test('rejects a stale synthetic signature without blocking collection', async () => {
  const { request, environment } = signedSyntheticRequest(
    String(nowSeconds - 301)
  )

  const verdict = await classifyBrowserEventTraffic(
    request,
    dependencies({ environment })
  )

  assert.deepEqual(verdict, {
    classification: 'human_or_unknown',
    excludeFromMarketingDispatch: false
  })
})

test('does not trust a caller-supplied BotID header', async () => {
  const request = new Request(
    'https://utekos.no/api/events/page-view',
    {
      headers: {
        'x-is-human': JSON.stringify({ b: 1, d: 1 })
      },
      method: 'POST'
    }
  )
  const verdict = await classifyBrowserEventTraffic(
    request,
    dependencies()
  )

  assert.deepEqual(verdict, {
    classification: 'human_or_unknown',
    excludeFromMarketingDispatch: false
  })
})
