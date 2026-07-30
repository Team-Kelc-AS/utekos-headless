import assert from 'node:assert/strict'
import test from 'node:test'
import {
  analyzeFlightCompleteness,
  analyzeHtmlCompleteness,
  redactHeaders,
  toSafeArtifact
} from './ppr-rsc-completeness.mjs'
import {
  assertProbePassed,
  buildRequest,
  evaluateResponse,
  runPprRscProbe
} from './ppr-rsc-probe.mjs'

const COMPLETE_HTML =
  '<!DOCTYPE html><html lang="no"><head><title>ok</title></head>' +
  '<body><script>self.__next_f.push([1,"0:null\\n"])</script></body></html>'
const TRUNCATED_HTML =
  '<!DOCTYPE html><html lang="no"><head><title>bad</title></head>' +
  '<body><script>self.__next_f.push([1,"0:'
const COMPLETE_FLIGHT = [
  '1:I[100,["/_next/static/chunks/a.js","/_next/static/chunks/b.js"],"Module"]',
  '0:["$","html",null,{}]',
  '2:null',
  ''
].join('\n')
const TRUNCATED_FLIGHT = [
  '1:I[100,["/_next/static/chunks/a.js"',
  '0:["$","html"'
].join('\n')
const EMPTY_FLIGHT = ''

test('html completeness passes on closed documents with flight bootstrap', () => {
  const result = analyzeHtmlCompleteness(COMPLETE_HTML)
  assert.equal(result.complete, true)
  assert.deepEqual(result.reasons, [])
  assert.ok(result.metrics.nextFPushes >= 1)
})

test('html completeness fails when truncated', () => {
  const result = analyzeHtmlCompleteness(TRUNCATED_HTML)
  assert.equal(result.complete, false)
  assert.ok(result.reasons.includes('missing_html_close'))
  assert.ok(result.reasons.includes('missing_body_close'))
})

test('flight completeness passes on newline-terminated rows', () => {
  const result = analyzeFlightCompleteness(COMPLETE_FLIGHT, {
    contentType: 'text/x-component'
  })
  assert.equal(result.complete, true)
  assert.equal(result.metrics.flightRowCount, 3)
})

test('flight completeness fails on truncated or empty payloads', () => {
  const truncated = analyzeFlightCompleteness(TRUNCATED_FLIGHT, {
    contentType: 'text/x-component'
  })
  const empty = analyzeFlightCompleteness(EMPTY_FLIGHT, {
    contentType: 'text/x-component'
  })
  assert.equal(truncated.complete, false)
  assert.ok(
    truncated.reasons.includes('missing_trailing_newline')
  )
  assert.equal(empty.complete, false)
  assert.ok(empty.reasons.includes('empty_body'))
})

test('buildRequest emits RSC header and _rsc query for flight', () => {
  const flight = buildRequest('/produkter', 'flight')
  assert.match(flight.path, /\?_rsc=kri14$/)
  assert.equal(flight.headers.rsc, '1')
  assert.equal(
    buildRequest('/', 'html').headers.accept.includes(
      'text/html'
    ),
    true
  )
})

test('probe input requires repeated origin-relative observations', async () => {
  await assert.rejects(
    runPprRscProbe({
      baseUrl: 'https://example.com',
      routes: ['//other.example/path'],
      sequences: 1,
      fetchImpl: async () => new Response(COMPLETE_HTML)
    })
  )
})

test('evaluateResponse fails truncated html even with HTTP 200', () => {
  const response = new Response(TRUNCATED_HTML, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' }
  })
  const evaluated = evaluateResponse(
    response,
    TRUNCATED_HTML,
    'html'
  )
  assert.equal(evaluated.ok, false)
  assert.ok(evaluated.completeness.reasons.length > 0)
})

test('evaluateResponse passes complete flight payloads', () => {
  const response = new Response(COMPLETE_FLIGHT, {
    status: 200,
    headers: { 'content-type': 'text/x-component' }
  })
  const evaluated = evaluateResponse(
    response,
    COMPLETE_FLIGHT,
    'flight'
  )
  assert.equal(evaluated.ok, true)
})

test('redactHeaders removes secrets from diagnostic artifacts', () => {
  const redacted = redactHeaders({
    'authorization': 'Bearer super-secret-token-value',
    'cookie': 'session=abc',
    'x-vercel-cache': 'HIT',
    'content-type': 'text/x-component'
  })
  assert.equal(redacted.authorization, '[redacted]')
  assert.equal(redacted.cookie, '[redacted]')
  assert.equal(redacted['x-vercel-cache'], 'HIT')
})

test('toSafeArtifact never embeds response-body content', () => {
  const huge = `${'a'.repeat(5000)}${COMPLETE_HTML}`
  const artifact = toSafeArtifact({
    route: '/',
    kind: 'html',
    startedAt: '2026-07-28T00:00:00.000Z',
    endedAt: '2026-07-28T00:00:01.000Z',
    durationMs: 1000,
    status: 200,
    ok: true,
    headers: { 'set-cookie': 'sid=1', 'x-vercel-cache': 'MISS' },
    completeness: analyzeHtmlCompleteness(COMPLETE_HTML),
    body: huge
  })
  assert.equal(Object.hasOwn(artifact, 'bodyHead'), false)
  assert.equal(Object.hasOwn(artifact, 'bodyTail'), false)
  assert.equal(artifact.headers['set-cookie'], '[redacted]')
  assert.equal(Object.hasOwn(artifact, 'body'), false)
})

test('runPprRscProbe compares initial and repeat observations and fails on truncation', async () => {
  /** @type {Map<string, number>} */
  const counts = new Map()
  const fetchImpl = async url => {
    const key = String(url)
    const n = (counts.get(key) ?? 0) + 1
    counts.set(key, n)
    const isFlight = key.includes('_rsc=')
    if (isFlight) {
      return new Response(COMPLETE_FLIGHT, {
        status: 200,
        headers: {
          'content-type': 'text/x-component',
          'x-vercel-cache': n === 1 ? 'MISS' : 'HIT'
        }
      })
    }
    // Force truncation on the repeated HTML observation for /
    if (key.endsWith('/') && n > 1) {
      return new Response(TRUNCATED_HTML, {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'x-vercel-cache': 'HIT'
        }
      })
    }
    return new Response(COMPLETE_HTML, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'x-vercel-cache': n === 1 ? 'MISS' : 'HIT'
      }
    })
  }

  const report = await runPprRscProbe({
    baseUrl: 'https://example.test',
    routes: ['/', '/produkter'],
    sequences: 2,
    fetchImpl
  })

  assert.equal(report.ok, false)
  assert.ok(report.initialRepeatComparison.length >= 4)
  const homeHtml = report.initialRepeatComparison.find(
    row => row.route === '/' && row.kind === 'html'
  )
  assert.equal(homeHtml?.initial?.ok, true)
  assert.equal(homeHtml?.repeat?.ok, false)
  assert.equal(homeHtml?.repeat?.vercelCache, 'HIT')
  assert.throws(
    () => assertProbePassed(report),
    /PPR\/RSC probe failed/
  )
})

test('runPprRscProbe passes when every repeated response is complete', async () => {
  const fetchImpl = async url => {
    const isFlight = String(url).includes('_rsc=')
    return new Response(
      isFlight ? COMPLETE_FLIGHT : COMPLETE_HTML,
      {
        status: 200,
        headers: {
          'content-type':
            isFlight ?
              'text/x-component'
            : 'text/html; charset=utf-8',
          'x-vercel-cache': 'HIT'
        }
      }
    )
  }

  const report = await runPprRscProbe({
    baseUrl: 'https://example.test/',
    routes: ['/', '/produkter'],
    sequences: 2,
    fetchImpl
  })

  assert.equal(report.ok, true)
  assert.equal(report.failureCount, 0)
  assert.equal(
    report.initialRepeatComparison.every(
      row => row.bothComplete
    ),
    true
  )
  assertProbePassed(report)
})
