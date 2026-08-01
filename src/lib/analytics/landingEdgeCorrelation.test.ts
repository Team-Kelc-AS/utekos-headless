import assert from 'node:assert/strict'
import test from 'node:test'
import {
  LANDING_EDGE_CORRELATION_COOKIE_NAME,
  readLandingEdgeCorrelation,
  readLandingEdgeCorrelationCookie,
  readLandingEdgeRequestId
} from './landingEdgeCorrelation'

const correlationToken =
  '1754029200.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq'

test('reads the opaque edge request id from matching navigation server timing', () => {
  assert.equal(
    readLandingEdgeRequestId(
      'https://utekos.no/skreddersy-varmen?utm_source=facebook',
      [
        {
          name: 'https://utekos.no/skreddersy-varmen?utm_source=facebook',
          serverTiming: [
            {
              description:
                '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd',
              name: 'utekos_edge'
            }
          ]
        }
      ]
    ),
    '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd'
  )
})

test('reads the signed correlation pair from the initial navigation', () => {
  assert.deepEqual(
    readLandingEdgeCorrelation(
      'https://utekos.no/skreddersy-varmen?utm_source=facebook',
      [
        {
          name: 'https://utekos.no/skreddersy-varmen?utm_source=facebook',
          serverTiming: [
            {
              description:
                '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd',
              name: 'utekos_edge'
            },
            {
              description: correlationToken,
              name: 'utekos_edge_auth'
            }
          ]
        }
      ]
    ),
    {
      edgeRequestId: '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd',
      token: correlationToken
    }
  )
})

test('rejects malformed ids and an unrelated navigation resource', () => {
  assert.equal(
    readLandingEdgeRequestId('https://utekos.no/comfyrobe', [
      {
        name: 'https://utekos.no/skreddersy-varmen',
        serverTiming: [
          { description: 'not-an-id', name: 'utekos_edge' }
        ]
      }
    ]),
    undefined
  )
})

test('requires a well-formed authentication token for consent correlation', () => {
  assert.equal(
    readLandingEdgeCorrelation(
      'https://utekos.no/skreddersy-varmen',
      [
        {
          name: 'https://utekos.no/skreddersy-varmen',
          serverTiming: [
            {
              description:
                '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd',
              name: 'utekos_edge'
            },
            {
              description: 'not-a-token',
              name: 'utekos_edge_auth'
            }
          ]
        }
      ]
    ),
    undefined
  )
})

test('reads the signed correlation pair from the first-party fallback cookie', () => {
  assert.deepEqual(
    readLandingEdgeCorrelationCookie(
      `other=value; ${LANDING_EDGE_CORRELATION_COOKIE_NAME}=47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd.${correlationToken}`
    ),
    {
      edgeRequestId: '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd',
      token: correlationToken
    }
  )
})

test('rejects malformed or similarly named correlation cookies', () => {
  assert.equal(
    readLandingEdgeCorrelationCookie(
      `${LANDING_EDGE_CORRELATION_COOKIE_NAME}-legacy=47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd.${correlationToken}`
    ),
    undefined
  )
  assert.equal(
    readLandingEdgeCorrelationCookie(
      `${LANDING_EDGE_CORRELATION_COOKIE_NAME}=not-a-correlation`
    ),
    undefined
  )
})
