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

test('Magasinet upgrade redirect preserves attribution and removes unrelated query parameters', async () => {
  const originalInfo = console.info
  const restoreSigningSecret = installSigningSecret()
  console.info = () => {}

  try {
    const { proxy } = await productionProxy
    const response = await proxy(
      new NextRequest(
        'https://utekos.no/magasinet/artikkel?fbclid=AbC-123&email=synthetic%40example.invalid&utm_source=facebook&utm_campaign=Vinter%20Norge&variant=123',
        { headers: { accept: 'text/html' } }
      )
    )

    assert.equal(response.status, 307)
    assert.equal(
      response.headers.get('location'),
      'https://utekos.no/magasinet/oppgradering?fbclid=AbC-123&utm_source=facebook&utm_campaign=Vinter%20Norge'
    )
    assert.equal(response.headers.get('server-timing'), null)
  } finally {
    console.info = originalInfo
    restoreSigningSecret()
  }
})

test('Magasinet upgrade redirect takes precedence over Markdown negotiation', async () => {
  const { proxy } = await productionProxy
  const response = await proxy(
    new NextRequest(
      'https://utekos.no/magasinet/hva-er-utekos?utm_source=assistant',
      { headers: { accept: 'text/markdown' } }
    )
  )

  assert.equal(response.status, 307)
  assert.equal(
    response.headers.get('location'),
    'https://utekos.no/magasinet/oppgradering?utm_source=assistant'
  )
  assert.equal(response.headers.get('x-middleware-rewrite'), null)
})

test('NBCC redirect forwards exact attribution and captures Meta cookies without logging query values', async () => {
  const messages: string[] = []
  const originalInfo = console.info
  console.info = message => messages.push(String(message))
  const query =
    'utm_source=SnapChat&utm_medium=paid_social&utm_campaign=Vinter%20Norge&utm_content=Kreativ+1&utm_term=test&utm_id=1&dclid=AbC&epik=AbC&fbclid=AbC&gclid=AbC&gbraid=AbC&wbraid=AbC&msclkid=AbC&sc_click_id=legacy&ScCid=%20AbC%2b%2F%3D%20&ttclid=AbC&twclid=AbC&campaign_id=1&campaign_name=Campaign&adset_id=2&adset_name=Set&ad_id=3&ad_name=Ad&hsa_cam=1&hsa_grp=2&hsa_ad=3'
  try {
    const { proxy } = await productionProxy
    const request = new NextRequest(
      `https://utekos.no/?${query}&email=synthetic%40example.invalid&token=private&variant=123`,
      {
        headers: {
          accept: 'text/html',
          referer: 'https://bergenhordaland.nbocc.no/'
        }
      }
    )
    const originalUrl = request.url
    const response = await proxy(request)
    assert.equal(response.status, 307)
    assert.equal(
      response.headers.get('location'),
      `https://utekos.no/nbcc?${query}`
    )
    assert.equal(request.url, originalUrl)
    assert.ok(response.cookies.get('_fbp'))
    assert.equal(
      response.cookies.get('_fbc')?.value.split('.')[3],
      'AbC'
    )
    assert.equal(response.headers.get('server-timing'), null)
    assert.equal(response.headers.get('vary'), null)
    assert.ok(messages.length > 0)
    for (const message of messages) {
      assert.equal(
        /utm_|ScCid|synthetic@|example.invalid|private/.test(
          message
        ),
        false
      )
    }
  } finally {
    console.info = originalInfo
  }
})

test('redirects without approved parameters have a clean destination URL', async () => {
  const { proxy } = await productionProxy
  for (const [source, destination] of [
    ['/', '/nbcc'],
    ['/magasinet/artikkel', '/magasinet/oppgradering'],
    ['/skreddersy-varmen/layout/legacy', '/skreddersy-varmen']
  ]) {
    const response = await proxy(
      new NextRequest(
        `https://utekos.no${source}?email=synthetic%40example.invalid&token=private`,
        { headers: { referer: 'https://nbocc.no/' } }
      )
    )
    assert.equal(response.status, 307)
    assert.equal(
      response.headers.get('location'),
      `https://utekos.no${destination}`
    )
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
    assert.equal(response.headers.get('server-timing'), null)
    assert.ok(response.cookies.get('_fbp'))
    assert.equal(
      response.cookies.get('_fbc')?.value.split('.')[3],
      'secret-click'
    )
  } finally {
    console.info = originalInfo
    restoreSigningSecret()
  }
})

test('forwards existing cookie and user-agent headers internally without exposing or reminting them', async () => {
  const { proxy } = await productionProxy
  const cookie =
    '_fbp=fb.1.1784194900000.123456789; _fbc=fb.1.1784195000000.observed-click'
  for (const pathname of [
    '/',
    '/produkter',
    '/skreddersy-varmen'
  ]) {
    const response = await proxy(
      new NextRequest(`https://utekos.no${pathname}`, {
        headers: {
          'accept': 'text/html',
          'sec-fetch-dest': 'document',
          cookie,
          'user-agent': 'proxy-test-browser'
        }
      })
    )

    assert.equal(
      response.headers.get('x-middleware-request-cookie'),
      cookie
    )
    assert.equal(
      response.headers.get('x-middleware-request-user-agent'),
      'proxy-test-browser'
    )
    assert.equal(response.headers.get('cookie'), null)
    assert.equal(response.headers.get('user-agent'), null)
    assert.equal(response.headers.get('set-cookie'), null)
    assert.equal(response.headers.get('location'), null)
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
    assert.equal(response.headers.get('server-timing'), null)
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
    assert.equal(timing, '')
    assert.doesNotMatch(timing, /utekos_edge_auth/u)
    assert.ok(response.cookies.get('_fbp'))
    assert.equal(
      response.cookies.get(
        LANDING_SYNTHETIC_CORRELATION_COOKIE_NAME
      ),
      undefined
    )
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
