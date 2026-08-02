import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createLandingEdgeCorrelationToken,
  LANDING_EDGE_CORRELATION_TOKEN_MAX_AGE_SECONDS,
  verifyLandingEdgeCorrelationToken
} from './landingEdgeCorrelationToken'

const edgeRequestId = '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd'
const issuedAtSeconds = 1_754_029_200
const secret = 'landing-observability-test-secret-32-characters'

test('creates and verifies a short-lived token bound to one edge request', async () => {
  const token = await createLandingEdgeCorrelationToken({
    edgeRequestId,
    issuedAtSeconds,
    secret
  })

  assert.equal(
    await verifyLandingEdgeCorrelationToken({
      edgeRequestId,
      nowSeconds: issuedAtSeconds + 60,
      secret,
      token
    }),
    true
  )
  assert.equal(
    await verifyLandingEdgeCorrelationToken({
      edgeRequestId: 'aa5bc9ec-6398-4caf-8813-48b1bd3ed2d2',
      nowSeconds: issuedAtSeconds + 60,
      secret,
      token
    }),
    false
  )
})

test('rejects expired, future, malformed and wrongly signed tokens', async () => {
  const token = await createLandingEdgeCorrelationToken({
    edgeRequestId,
    issuedAtSeconds,
    secret
  })

  for (const candidate of [
    {
      nowSeconds:
        issuedAtSeconds +
        LANDING_EDGE_CORRELATION_TOKEN_MAX_AGE_SECONDS +
        1,
      secret,
      token
    },
    { nowSeconds: issuedAtSeconds - 61, secret, token },
    {
      nowSeconds: issuedAtSeconds,
      secret: 'different-landing-observability-secret-value',
      token
    },
    { nowSeconds: issuedAtSeconds, secret, token: 'malformed' }
  ]) {
    assert.equal(
      await verifyLandingEdgeCorrelationToken({
        edgeRequestId,
        ...candidate
      }),
      false
    )
  }
})

test('rejects a signing secret that is too short', async () => {
  await assert.rejects(
    createLandingEdgeCorrelationToken({
      edgeRequestId,
      issuedAtSeconds,
      secret: 'too-short'
    }),
    /at least 32 characters/i
  )
})
