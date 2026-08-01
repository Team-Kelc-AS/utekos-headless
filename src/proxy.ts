// src/proxy.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isKlarnaFeedHost } from '@/lib/merchant-feeds/klarna/klarnaFeedHost'
import { isBlockedUserAgent } from '@/lib/security/isBlockedUserAgent'
import { buildReportOnlyCsp } from '@/lib/security/buildReportOnlyCsp'
import { isMagazineViewTransitionPreviewEnabled } from '@/app/magasinet/utils/isMagazineViewTransitionPreviewEnabled'
import {
  LANDING_EDGE_AUTH_SERVER_TIMING_NAME,
  LANDING_EDGE_CORRELATION_COOKIE_NAME,
  LANDING_EDGE_SERVER_TIMING_NAME,
  LANDING_SYNTHETIC_CORRELATION_COOKIE_NAME,
  readLandingSyntheticCorrelationCookie
} from '@/lib/analytics/landingEdgeCorrelation'
import { createLandingEdgeCorrelationToken } from '@/lib/analytics/landingEdgeCorrelationToken'
import { hasVerifiedSyntheticSignature } from '@/lib/analytics/syntheticTrafficSignature'
import { deriveLandingEdgeRequestId } from '../supabase/functions/_shared/landing-edge-request-id'

const allowedReferrers = new Set([
  'nbocc.no',
  'bergenhordaland.nbocc.no'
])

const NBCC_DESTINATION_PATH = '/nbcc'

const MAGASINET_UPGRADE_ENABLED = true
const MAGASINET_UPGRADE_PATH = '/magasinet/oppgradering'
const MAGASINET_VIEW_TRANSITION_PREVIEW_ENABLED =
  isMagazineViewTransitionPreviewEnabled({
    VERCEL_ENV: process.env.VERCEL_ENV,
    MAGAZINE_VIEW_TRANSITIONS_PREVIEW_ENABLED:
      process.env.MAGAZINE_VIEW_TRANSITIONS_PREVIEW_ENABLED
  })
const KLARNA_FEED_PATH = '/klarna-feed.xml'
export const LANDING_EDGE_REQUEST_ID_HEADER =
  'x-utekos-edge-request-id'

function isDocumentNavigation(request: NextRequest) {
  if (request.method !== 'GET') return false
  if (request.headers.get('rsc') === '1') return false
  if (request.headers.has('next-router-prefetch')) return false

  const purpose = request.headers.get('purpose')
  if (purpose?.toLowerCase() === 'prefetch') return false

  const destination = request.headers.get('sec-fetch-dest')
  if (destination) return destination === 'document'

  const accept = request.headers.get('accept')
  return (
    !accept || accept.includes('text/html') || accept === '*/*'
  )
}

type LandingEdgeCorrelation = {
  clearSynthetic: boolean
  edgeRequestId: string
  synthetic: boolean
  token?: string
}

async function createLandingEdgeCorrelation(
  request: NextRequest
): Promise<LandingEdgeCorrelation | undefined> {
  if (!isDocumentNavigation(request)) return undefined

  const edgeRequestId =
    (await deriveLandingEdgeRequestId(
      request.headers.get('x-vercel-id')
    )) ?? crypto.randomUUID()
  console.info(
    `[landing-edge] ${JSON.stringify({ edge_request_id: edgeRequestId })}`
  )
  const synthetic = await hasVerifiedSyntheticSignature(
    request,
    process.env,
    Math.floor(Date.now() / 1000)
  )
  const clearSynthetic = Boolean(
    readLandingSyntheticCorrelationCookie(
      request.headers.get('cookie') ?? ''
    )
  )

  const secret =
    process.env.LANDING_OBSERVABILITY_SIGNING_SECRET?.trim()
  if (!secret) {
    console.error(
      '[landing-edge] correlation signing unavailable'
    )
    return {
      clearSynthetic,
      edgeRequestId,
      synthetic: false
    }
  }

  try {
    const token = await createLandingEdgeCorrelationToken({
      edgeRequestId,
      issuedAtSeconds: Math.floor(Date.now() / 1000),
      secret
    })

    return {
      clearSynthetic,
      edgeRequestId,
      synthetic,
      token
    }
  } catch {
    console.error(
      '[landing-edge] correlation signing unavailable'
    )
    return {
      clearSynthetic,
      edgeRequestId,
      synthetic: false
    }
  }
}

function withLandingEdgeCorrelation<T extends NextResponse>(
  response: T,
  correlation: LandingEdgeCorrelation | undefined
): T {
  if (!correlation) return response

  response.headers.append(
    'Server-Timing',
    `${LANDING_EDGE_SERVER_TIMING_NAME};desc="${correlation.edgeRequestId}"`
  )
  if (correlation.token) {
    response.headers.append(
      'Server-Timing',
      `${LANDING_EDGE_AUTH_SERVER_TIMING_NAME};desc="${correlation.token}"`
    )
    response.cookies.set({
      httpOnly: false,
      maxAge: 30 * 60,
      name: LANDING_EDGE_CORRELATION_COOKIE_NAME,
      path: '/',
      sameSite: 'lax',
      secure: true,
      value: `${correlation.edgeRequestId}.${correlation.token}`
    })
    if (correlation.synthetic || correlation.clearSynthetic) {
      response.cookies.set({
        httpOnly: true,
        maxAge: correlation.synthetic ? 30 * 60 : 0,
        name: LANDING_SYNTHETIC_CORRELATION_COOKIE_NAME,
        path: '/',
        sameSite: 'lax',
        secure: true,
        value:
          correlation.synthetic ?
            `${correlation.edgeRequestId}.${correlation.token}`
          : ''
      })
    }
  }
  return response
}

function isAllowedNboccReferrer(request: NextRequest) {
  const referer = request.headers.get('referer')

  if (!referer) {
    return false
  }

  try {
    const refererUrl = new URL(referer)
    const hostname = refererUrl.hostname.replace(/^www\./, '')

    return allowedReferrers.has(hostname)
  } catch {
    return false
  }
}

function continueDocumentRequest(
  request: NextRequest,
  correlation?: LandingEdgeCorrelation
): NextResponse {
  const requestHeaders = new Headers(request.headers)
  if (correlation) {
    requestHeaders.set(
      LANDING_EDGE_REQUEST_ID_HEADER,
      correlation.edgeRequestId
    )
  }

  return withLandingEdgeCorrelation(
    withReportOnlyCsp(
      NextResponse.next({ request: { headers: requestHeaders } })
    ),
    correlation
  )
}

function withReportOnlyCsp<T extends NextResponse>(
  response: T
): T {
  response.headers.set(
    'Content-Security-Policy-Report-Only',
    buildReportOnlyCsp()
  )
  return response
}

function rewriteKlarnaFeedRoot(
  request: NextRequest
): NextResponse {
  const feedUrl = request.nextUrl.clone()
  feedUrl.pathname = KLARNA_FEED_PATH

  return withReportOnlyCsp(NextResponse.rewrite(feedUrl))
}

export async function proxy(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  const pathname = request.nextUrl.pathname
  const hostname = request.nextUrl.hostname

  if (isBlockedUserAgent(userAgent)) {
    return withReportOnlyCsp(
      new NextResponse(null, {
        status: 403,
        statusText: 'Forbidden'
      })
    )
  }

  const correlation = await createLandingEdgeCorrelation(request)

  if (isKlarnaFeedHost(hostname)) {
    if (pathname === '/' || pathname === '') {
      return rewriteKlarnaFeedRoot(request)
    }

    if (pathname === KLARNA_FEED_PATH) {
      return continueDocumentRequest(request, correlation)
    }

    return withReportOnlyCsp(
      new NextResponse(null, {
        status: 404,
        statusText: 'Not Found'
      })
    )
  }

  if (pathname === '/' && isAllowedNboccReferrer(request)) {
    const redirectUrl = new URL(
      NBCC_DESTINATION_PATH,
      request.url
    )

    redirectUrl.search = request.nextUrl.search

    return withLandingEdgeCorrelation(
      withReportOnlyCsp(NextResponse.redirect(redirectUrl, 307)),
      correlation
    )
  }

  if (
    MAGASINET_UPGRADE_ENABLED &&
    !MAGASINET_VIEW_TRANSITION_PREVIEW_ENABLED &&
    pathname.startsWith('/magasinet')
  ) {
    if (
      pathname === MAGASINET_UPGRADE_PATH ||
      pathname.startsWith(`${MAGASINET_UPGRADE_PATH}/`)
    ) {
      return continueDocumentRequest(request, correlation)
    }

    const upgradeUrl = new URL(
      MAGASINET_UPGRADE_PATH,
      request.url
    )
    upgradeUrl.search = request.nextUrl.search

    return withLandingEdgeCorrelation(
      withReportOnlyCsp(NextResponse.redirect(upgradeUrl)),
      correlation
    )
  }

  return continueDocumentRequest(request, correlation)
}

export const config = {
  matcher: [
    '/((?!api|sporing|__gtg|__sgtm|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|videos|apple-icon|icon|manifest).*)'
  ]
}
