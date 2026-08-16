import assert from 'node:assert/strict'
import test from 'node:test'
import { buildReportOnlyCsp } from './buildReportOnlyCsp'

test('protects structural directives and permits the consent-aware tag gateways', () => {
  const csp = buildReportOnlyCsp()

  assert.match(csp, /object-src 'none'/)
  assert.match(csp, /base-uri 'self'/)
  assert.doesNotMatch(csp, /frame-ancestors/)
  assert.match(csp, /connect-src[^;]*https:\/\/js\.klarna\.com/)
  assert.match(csp, /script-src[^;]*https:\/\/js\.klarna\.com/)
  assert.match(csp, /report-uri \/api\/security\/csp-report/)
  assert.match(
    csp,
    /script-src[^;]*https:\/\/consent\.cookiebot\.com/
  )
  assert.match(
    csp,
    /script-src[^;]*https:\/\/consent\.cookiebot\.eu/
  )
  assert.match(
    csp,
    /script-src[^;]*https:\/\/www\.googletagmanager\.com/
  )
  assert.match(
    csp,
    /connect-src[^;]*https:\/\/cloud\.server\.utekos\.no/
  )
  assert.match(
    csp,
    /connect-src[^;]*https:\/\/pagead2\.googlesyndication\.com/
  )
  assert.doesNotMatch(csp, /posthog/)
  assert.doesNotMatch(csp, /nonce-/)
})

test('permits the third-party scripts and frames observed during report-only rollout', () => {
  const csp = buildReportOnlyCsp()

  assert.match(
    csp,
    /script-src[^;]*https:\/\/consentcdn\.cookiebot\.eu/
  )
  assert.match(csp, /script-src[^;]*https:\/\/x\.klarnacdn\.net/)
  assert.match(csp, /script-src[^;]*https:\/\/\*\.clarity\.ms/)
  assert.match(csp, /script-src[^;]*https:\/\/bat\.bing\.com/)
  assert.match(
    csp,
    /script-src[^;]*https:\/\/connect\.facebook\.net/
  )
  assert.match(csp, /script-src[^;]*https:\/\/s\.pinimg\.com/)
  assert.match(
    csp,
    /script-src[^;]*https:\/\/googleads\.g\.doubleclick\.net/
  )
  assert.match(
    csp,
    /script-src[^;]*https:\/\/cdn\.shopify\.com/
  )
  assert.match(
    csp,
    /connect-src[^;]*https:\/\/kasse\.utekos\.no/
  )
  assert.match(
    csp,
    /connect-src[^;]*https:\/\/monorail-edge\.shopifysvc\.com/
  )
  assert.match(
    csp,
    /connect-src[^;]*https:\/\/consentcdn\.cookiebot\.eu/
  )
  assert.match(
    csp,
    /connect-src[^;]*https:\/\/x\.klarnacdn\.net/
  )
  assert.match(csp, /connect-src[^;]*https:\/\/\*\.clarity\.ms/)
  assert.match(csp, /connect-src[^;]*https:\/\/bat\.bing\.com/)
  assert.match(
    csp,
    /connect-src[^;]*https:\/\/connect\.facebook\.net/
  )
  assert.match(
    csp,
    /connect-src[^;]*https:\/\/www\.facebook\.com/
  )
  assert.match(csp, /connect-src[^;]*https:\/\/s\.pinimg\.com/)
  assert.match(
    csp,
    /connect-src[^;]*https:\/\/ct\.pinterest\.com/
  )
  assert.match(
    csp,
    /connect-src[^;]*https:\/\/mpc2-prod-25-is5qnl632q-wl\.a\.run\.app/
  )
  assert.match(
    csp,
    /connect-src[^;]*https:\/\/5z-2b6b7616f94640c2840d1841e1ac24c3\.ecs\.us-east-1\.on\.aws/
  )
  assert.match(
    csp,
    /connect-src[^;]*https:\/\/googleads\.g\.doubleclick\.net/
  )
  assert.match(
    csp,
    /connect-src[^;]*https:\/\/ad\.doubleclick\.net/
  )
  assert.match(
    csp,
    /connect-src[^;]*https:\/\/\*\.klarnaevt\.com/
  )
  assert.match(csp, /img-src[^;]*https:\/\/c\.bing\.com/)
  assert.match(csp, /img-src[^;]*https:\/\/www\.facebook\.com/)
  assert.match(csp, /img-src[^;]*https:\/\/ct\.pinterest\.com/)
  assert.match(csp, /frame-src[^;]*https:\/\/www\.facebook\.com/)
  assert.match(
    csp,
    /frame-src[^;]*https:\/\/www\.youtube-nocookie\.com/
  )
  assert.match(csp, /frame-src[^;]*https:\/\/vercel\.live/)
  assert.doesNotMatch(
    csp,
    /frame-src[^;]*https:\/\/mpc2-prod-25-is5qnl632q-wl\.a\.run\.app/
  )
})

test('permits GA4 advertising hosts and Klarna CDN assets required by report-only rollout', () => {
  const csp = buildReportOnlyCsp()

  assert.match(
    csp,
    /connect-src[^;]*https:\/\/\*\.analytics\.google\.com/
  )
  assert.match(
    csp,
    /connect-src[^;]*https:\/\/\*\.g\.doubleclick\.net/
  )
  assert.match(csp, /connect-src[^;]*https:\/\/\*\.google\.com/)
  assert.match(csp, /connect-src[^;]*https:\/\/\*\.google\.no/)
  assert.match(
    csp,
    /img-src[^;]*https:\/\/\*\.analytics\.google\.com/
  )
  assert.match(
    csp,
    /img-src[^;]*https:\/\/\*\.g\.doubleclick\.net/
  )
  assert.match(csp, /img-src[^;]*https:\/\/\*\.google\.com/)
  assert.match(csp, /img-src[^;]*https:\/\/\*\.google\.no/)
  assert.match(csp, /style-src[^;]*https:\/\/x\.klarnacdn\.net/)
  assert.match(csp, /font-src[^;]*https:\/\/x\.klarnacdn\.net/)
  assert.match(csp, /media-src 'self' data: blob:/)
  assert.match(
    csp,
    /script-src[^;]*https:\/\/va\.vercel-scripts\.com/
  )
  assert.match(
    csp,
    /connect-src[^;]*https:\/\/vitals\.vercel-insights\.com/
  )
  assert.match(
    csp,
    /connect-src[^;]*https:\/\/vitals\.vercel-analytics\.com/
  )
  assert.match(
    csp,
    /connect-src[^;]*https:\/\/reporting\.cdndex\.io/
  )
  assert.match(csp, /connect-src[^;]*https:\/\/\*\.cdndex\.io/)

  assert.doesNotMatch(
    csp,
    /connect-src[^;]*https:\/\/www\.google\.com(?:\s|;|$)/
  )
  assert.doesNotMatch(
    csp,
    /img-src[^;]*https:\/\/www\.google\.com(?:\s|;|$)/
  )
  assert.doesNotMatch(
    csp,
    /(?:^|;\s)(?:default-src|connect-src|img-src|script-src|style-src|font-src)[^;]*\shttps:(?:\s|;|$)/
  )
})
