import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { deriveLandingEdgeRequestId } from '../supabase/functions/_shared/landing-edge-request-id'
import {
  SYNTHETIC_SIGNATURE_HEADER,
  SYNTHETIC_TIMESTAMP_HEADER,
  syntheticSignaturePayload
} from './lib/analytics/syntheticTrafficSignature'
import { LANDING_SYNTHETIC_CORRELATION_COOKIE_NAME } from './lib/analytics/landingEdgeCorrelation'

async function loadProductionProxy() {
  const originalVercelEnvironment = process.env.VERCEL_ENV
  const originalPreviewFlag =
    process.env.MAGAZINE_VIEW_TRANSITIONS_PREVIEW_ENABLED

  process.env.VERCEL_ENV = 'production'
  delete process.env.MAGAZINE_VIEW_TRANSITIONS_PREVIEW_ENABLED

  try {
    return await import('./proxy')
  } finally {
    if (originalVercelEnvironment === undefined) {
      delete process.env.VERCEL_ENV
    } else {
      process.env.VERCEL_ENV = originalVercelEnvironment
    }

    if (originalPreviewFlag === undefined) {
      delete process.env
        .MAGAZINE_VIEW_TRANSITIONS_PREVIEW_ENABLED
    } else {
      process.env.MAGAZINE_VIEW_TRANSITIONS_PREVIEW_ENABLED =
        originalPreviewFlag
    }
  }
}

const productionProxy = loadProductionProxy()
const signingSecret =
  'landing-observability-proxy-test-secret-value'
const syntheticSecret = 'synthetic-proxy-test-secret-value'

function installSigningSecret() {
  const original =
    process.env.LANDING_OBSERVABILITY_SIGNING_SECRET
  process.env.LANDING_OBSERVABILITY_SIGNING_SECRET =
    signingSecret

  return () => {
    if (original === undefined) {
      delete process.env.LANDING_OBSERVABILITY_SIGNING_SECRET
    } else {
      process.env.LANDING_OBSERVABILITY_SIGNING_SECRET = original
    }
  }
}

function installSyntheticSecret() {
  const original = process.env.UTEKOS_SYNTHETIC_TRAFFIC_SECRET
  process.env.UTEKOS_SYNTHETIC_TRAFFIC_SECRET = syntheticSecret

  return () => {
    if (original === undefined) {
      delete process.env.UTEKOS_SYNTHETIC_TRAFFIC_SECRET
    } else {
      process.env.UTEKOS_SYNTHETIC_TRAFFIC_SECRET = original
    }
  }
}

function signedSyntheticHeaders(url: string) {
  const timestamp = String(Math.floor(Date.now() / 1000))
  const unsigned = new Request(url, { method: 'GET' })
  const signature = createHmac('sha256', syntheticSecret)
    .update(syntheticSignaturePayload(unsigned, timestamp))
    .digest('hex')

  return {
    accept: 'text/html',
    [SYNTHETIC_SIGNATURE_HEADER]: signature,
    [SYNTHETIC_TIMESTAMP_HEADER]: timestamp
  }
}

test('Magasinet upgrade redirect preserves the complete query string', async () => {
  const originalInfo = console.info
  const restoreSigningSecret = installSigningSecret()
  console.info = () => {}

  try {
    const { proxy } = await productionProxy
    const response = await proxy(
      new NextRequest(
        'https://utekos.no/magasinet/artikkel?fbclid=AbC-123&utm_source=facebook&utm_campaign=Vinter%20Norge',
        { headers: { accept: 'text/html' } }
      )
    )

    assert.equal(response.status, 307)
    assert.equal(
      response.headers.get('location'),
      'https://utekos.no/magasinet/oppgradering?fbclid=AbC-123&utm_source=facebook&utm_campaign=Vinter%20Norge'
    )
    assert.match(
      response.headers.get('server-timing') ?? '',
      /^utekos_edge;desc="[0-9a-f-]{36}", utekos_edge_auth;desc="\d{10}\.[A-Za-z0-9_-]{43}"$/i
    )
  } finally {
    console.info = originalInfo
    restoreSigningSecret()
  }
})

test('correlates a document request without logging its landing query', async () => {
  const messages: string[] = []
  const originalInfo = console.info
  const restoreSigningSecret = installSigningSecret()
  console.info = message => messages.push(String(message))

  try {
    const { proxy } = await productionProxy
    const response = await proxy(
      new NextRequest(
        'https://utekos.no/skreddersy-varmen?fbclid=secret-click&utm_source=facebook',
        {
          headers: {
            'accept': 'text/html',
            'sec-fetch-dest': 'document',
            'x-vercel-id':
              'arn1::cdwvz-1785574222361-9968da94ed15'
          }
        }
      )
    )
    const message = messages[0] ?? ''
    const edgeRequestId = JSON.parse(
      message.slice('[landing-edge] '.length)
    ).edge_request_id as string

    assert.equal(
      edgeRequestId,
      await deriveLandingEdgeRequestId(
        'cdwvz-1785574222361-9968da94ed15'
      )
    )
    assert.equal(message.includes('secret-click'), false)
    assert.equal(message.includes('utm_source'), false)
    assert.equal(
      response.headers.get(
        'x-middleware-request-x-utekos-edge-request-id'
      ),
      edgeRequestId
    )
    assert.match(
      response.headers.get('server-timing') ?? '',
      new RegExp(
        `^utekos_edge;desc="${edgeRequestId}", utekos_edge_auth;desc="\\d{10}\\.[A-Za-z0-9_-]{43}"$`,
        'i'
      )
    )
    assert.match(
      response.headers.get('set-cookie') ?? '',
      new RegExp(
        `^__Host-utekos-edge-correlation=${edgeRequestId}\\.\\d{10}\\.[A-Za-z0-9_-]{43}; Path=/; Expires=.+; Max-Age=1800; Secure; SameSite=lax$`,
        'i'
      )
    )
  } finally {
    console.info = originalInfo
    restoreSigningSecret()
  }
})

test('propagates a verified synthetic navigation to protected collectors', async () => {
  const originalInfo = console.info
  const restoreSigningSecret = installSigningSecret()
  const restoreSyntheticSecret = installSyntheticSecret()
  console.info = () => {}
  const url =
    'https://utekos.no/skreddersy-varmen?utm_campaign=codex_guard_canary'

  try {
    const { proxy } = await productionProxy
    const response = await proxy(
      new NextRequest(url, {
        headers: signedSyntheticHeaders(url)
      })
    )

    const syntheticCookie = response.cookies.get(
      LANDING_SYNTHETIC_CORRELATION_COOKIE_NAME
    )
    assert.match(
      syntheticCookie?.value ?? '',
      /^[0-9a-f-]{36}\.\d{10}\.[A-Za-z0-9_-]{43}$/iu
    )
    assert.equal(syntheticCookie?.httpOnly, true)
    assert.equal(syntheticCookie?.maxAge, 30 * 60)
    assert.equal(syntheticCookie?.secure, true)
  } finally {
    console.info = originalInfo
    restoreSyntheticSecret()
    restoreSigningSecret()
  }
})

test('clears a synthetic collector marker on the next unsigned document', async () => {
  const originalInfo = console.info
  const restoreSigningSecret = installSigningSecret()
  const restoreSyntheticSecret = installSyntheticSecret()
  console.info = () => {}
  const signedUrl =
    'https://utekos.no/skreddersy-varmen?utm_campaign=codex_guard_canary'

  try {
    const { proxy } = await productionProxy
    const signedResponse = await proxy(
      new NextRequest(signedUrl, {
        headers: signedSyntheticHeaders(signedUrl)
      })
    )
    const marker = signedResponse.cookies.get(
      LANDING_SYNTHETIC_CORRELATION_COOKIE_NAME
    )?.value
    assert.ok(marker)

    const response = await proxy(
      new NextRequest('https://utekos.no/', {
        headers: {
          accept: 'text/html',
          cookie: `${LANDING_SYNTHETIC_CORRELATION_COOKIE_NAME}=${marker}`
        }
      })
    )
    const cleared = response.cookies.get(
      LANDING_SYNTHETIC_CORRELATION_COOKIE_NAME
    )

    assert.equal(cleared?.value, '')
    assert.equal(cleared?.maxAge, 0)
  } finally {
    console.info = originalInfo
    restoreSyntheticSecret()
    restoreSigningSecret()
  }
})

test('does not correlate RSC or prefetch traffic as a landing', async () => {
  const originalInfo = console.info
  const restoreSigningSecret = installSigningSecret()
  let logCalls = 0
  console.info = () => {
    logCalls += 1
  }

  try {
    const { proxy } = await productionProxy
    const response = await proxy(
      new NextRequest('https://utekos.no/produkter/utekos-dun', {
        headers: { accept: 'text/x-component', rsc: '1' }
      })
    )

    assert.equal(response.headers.get('server-timing'), null)
    assert.equal(response.headers.get('set-cookie'), null)
    assert.equal(logCalls, 0)
  } finally {
    console.info = originalInfo
    restoreSigningSecret()
  }
})

test('does not correlate a static asset requested by a crawler', async () => {
  const originalInfo = console.info
  const restoreSigningSecret = installSigningSecret()
  let logCalls = 0
  console.info = () => {
    logCalls += 1
  }

  try {
    const { proxy } = await productionProxy
    const response = await proxy(
      new NextRequest(
        'https://utekos.no/tech-diagonal-halv-maritime-blue-bg.png',
        {
          headers: {
            'accept': '*/*',
            'user-agent':
              'meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)'
          }
        }
      )
    )

    assert.equal(response.headers.get('server-timing'), null)
    assert.equal(response.headers.get('set-cookie'), null)
    assert.equal(logCalls, 0)
  } finally {
    console.info = originalInfo
    restoreSigningSecret()
  }
})

test('leaves user-agent enforcement to Vercel Firewall', async () => {
  const originalInfo = console.info
  const restoreSigningSecret = installSigningSecret()
  console.info = () => {}

  try {
    const { proxy } = await productionProxy
    const response = await proxy(
      new NextRequest('https://utekos.no/skreddersy-varmen', {
        headers: {
          'accept': 'text/html',
          'sec-fetch-dest': 'document',
          'user-agent': 'curl/8.7.1'
        }
      })
    )

    assert.equal(response.status, 200)
    assert.match(
      response.headers.get('server-timing') ?? '',
      /utekos_edge;desc="[0-9a-f-]{36}"/u
    )
  } finally {
    console.info = originalInfo
    restoreSigningSecret()
  }
})

test('keeps document navigation available when the signing secret is invalid', async () => {
  const originalError = console.error
  const originalSecret =
    process.env.LANDING_OBSERVABILITY_SIGNING_SECRET
  process.env.LANDING_OBSERVABILITY_SIGNING_SECRET = 'too-short'
  console.error = () => {}

  try {
    const { proxy } = await productionProxy
    const response = await proxy(
      new NextRequest('https://utekos.no/skreddersy-varmen', {
        headers: { accept: 'text/html' }
      })
    )

    assert.equal(response.status, 200)
    const timing = response.headers.get('server-timing') ?? ''
    assert.match(timing, /utekos_edge;desc="[0-9a-f-]{36}"/u)
    assert.doesNotMatch(timing, /utekos_edge_auth/u)
    assert.equal(response.headers.get('set-cookie'), null)
  } finally {
    console.error = originalError
    if (originalSecret === undefined) {
      delete process.env.LANDING_OBSERVABILITY_SIGNING_SECRET
    } else {
      process.env.LANDING_OBSERVABILITY_SIGNING_SECRET =
        originalSecret
    }
  }
})
