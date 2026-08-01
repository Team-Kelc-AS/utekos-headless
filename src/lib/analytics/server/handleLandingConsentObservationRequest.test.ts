import assert from 'node:assert/strict'
import test from 'node:test'
import {
  handleLandingConsentObservationRequest,
  type LandingConsentObservationRow
} from './handleLandingConsentObservationRequest'

function request(body: unknown, origin = 'https://utekos.no') {
  return new Request(
    'https://utekos.no/api/observability/landing-consent',
    {
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json', origin },
      method: 'POST'
    }
  )
}

const validBody = {
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

test('stores a sanitized resolved consent stage with traffic classification', async () => {
  const rows: LandingConsentObservationRow[] = []
  const result = await handleLandingConsentObservationRequest(
    request(validBody),
    {
      classifyTraffic: async () => ({
        classification: 'human_or_unknown',
        excludeFromMarketingDispatch: false
      }),
      store: {
        upsert: async row => {
          rows.push(row)
          return true
        }
      },
      verifyCorrelation: async () => true
    }
  )

  assert.equal(result.status, 202)
  assert.deepEqual(rows, [
    {
      analyticsGranted: true,
      decision: 'partial',
      edgeRequestId: validBody.edge_request_id,
      marketingGranted: true,
      pageViewId: validBody.page_view_id,
      preferencesGranted: false,
      trafficClassification: 'human_or_unknown'
    }
  ])
})

test('rejects cross-origin and malformed observations before persistence', async () => {
  let writes = 0
  const dependencies = {
    classifyTraffic: async () => ({
      classification: 'human_or_unknown' as const,
      excludeFromMarketingDispatch: false
    }),
    store: {
      upsert: async () => {
        writes += 1
        return true
      }
    },
    verifyCorrelation: async () => true
  }

  assert.equal(
    (
      await handleLandingConsentObservationRequest(
        request(validBody, 'https://attacker.example'),
        dependencies
      )
    ).status,
    403
  )
  assert.equal(
    (
      await handleLandingConsentObservationRequest(
        request({ edge_request_id: 'invalid' }),
        dependencies
      )
    ).status,
    400
  )
  assert.equal(writes, 0)
})

test('rejects an unverified correlation before classification or persistence', async () => {
  let classifications = 0
  let writes = 0
  const result = await handleLandingConsentObservationRequest(
    request(validBody),
    {
      classifyTraffic: async () => {
        classifications += 1
        return {
          classification: 'human_or_unknown',
          excludeFromMarketingDispatch: false
        }
      },
      store: {
        upsert: async () => {
          writes += 1
          return true
        }
      },
      verifyCorrelation: async () => false
    }
  )

  assert.equal(result.status, 403)
  assert.equal(classifications, 0)
  assert.equal(writes, 0)
})

test('fails closed when verification is unavailable', async () => {
  const result = await handleLandingConsentObservationRequest(
    request(validBody),
    {
      classifyTraffic: async () => ({
        classification: 'human_or_unknown',
        excludeFromMarketingDispatch: false
      }),
      store: { upsert: async () => true },
      verifyCorrelation: async () => {
        throw new Error('missing secret')
      }
    }
  )

  assert.equal(result.status, 503)
})

test('rate-limits a correlation after the bounded store refuses it', async () => {
  const result = await handleLandingConsentObservationRequest(
    request(validBody),
    {
      classifyTraffic: async () => ({
        classification: 'human_or_unknown',
        excludeFromMarketingDispatch: false
      }),
      store: { upsert: async () => false },
      verifyCorrelation: async () => true
    }
  )

  assert.equal(result.status, 429)
  assert.equal(
    result.headers.get('cache-control'),
    'no-store, max-age=0'
  )
})
