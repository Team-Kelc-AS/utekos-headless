// src/proxy.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isKlarnaFeedHost } from '@/lib/merchant-feeds/klarna/klarnaFeedHost'
import { isBlockedUserAgent } from '@/lib/security/isBlockedUserAgent'
import { buildReportOnlyCsp } from '@/lib/security/buildReportOnlyCsp'
import { isMagazineViewTransitionPreviewEnabled } from '@/app/magasinet/utils/isMagazineViewTransitionPreviewEnabled'

const allowedReferrers = new Set(['nbocc.no', 'bergenhordaland.nbocc.no'])

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

function continueDocumentRequest(): NextResponse {
  return withReportOnlyCsp(NextResponse.next())
}

function withReportOnlyCsp<T extends NextResponse>(response: T): T {
  response.headers.set('Content-Security-Policy-Report-Only', buildReportOnlyCsp())
  return response
}

function rewriteKlarnaFeedRoot(request: NextRequest): NextResponse {
  const feedUrl = request.nextUrl.clone()
  feedUrl.pathname = KLARNA_FEED_PATH

  return withReportOnlyCsp(NextResponse.rewrite(feedUrl))
}

export async function proxy(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  const pathname = request.nextUrl.pathname
  const hostname = request.nextUrl.hostname

  if (isBlockedUserAgent(userAgent)) {
    return withReportOnlyCsp(new NextResponse(null, { status: 403, statusText: 'Forbidden' }))
  }

  if (isKlarnaFeedHost(hostname)) {
    if (pathname === '/' || pathname === '') {
      return rewriteKlarnaFeedRoot(request)
    }

    if (pathname === KLARNA_FEED_PATH) {
      return continueDocumentRequest()
    }

    return withReportOnlyCsp(
      new NextResponse(null, { status: 404, statusText: 'Not Found' })
    )
  }

  if (pathname === '/' && isAllowedNboccReferrer(request)) {
    const redirectUrl = new URL(NBCC_DESTINATION_PATH, request.url)

    redirectUrl.search = request.nextUrl.search

    return withReportOnlyCsp(NextResponse.redirect(redirectUrl, 307))
  }

  if (
    MAGASINET_UPGRADE_ENABLED
    && !MAGASINET_VIEW_TRANSITION_PREVIEW_ENABLED
    && pathname.startsWith('/magasinet')
  ) {
    if (
      pathname === MAGASINET_UPGRADE_PATH
      || pathname.startsWith(`${MAGASINET_UPGRADE_PATH}/`)
    ) {
      return continueDocumentRequest()
    }

    const upgradeUrl = new URL(MAGASINET_UPGRADE_PATH, request.url)
    return withReportOnlyCsp(NextResponse.redirect(upgradeUrl))
  }

  return continueDocumentRequest()
}

export const config = {
  matcher: [
    '/((?!api|sporing|__gtg|__sgtm|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|videos|apple-icon|icon|manifest).*)'
  ]
}
