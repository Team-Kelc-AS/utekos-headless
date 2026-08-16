const COOKIEBOT_ORIGINS = [
  'https://consent.cookiebot.com',
  'https://consent.cookiebot.eu',
  'https://consentcdn.cookiebot.com',
  'https://consentcdn.cookiebot.eu'
] as const

const TAG_GATEWAY_ORIGINS = [
  'https://www.googletagmanager.com',
  'https://cloud.server.utekos.no',
  ...COOKIEBOT_ORIGINS
] as const

/* eslint-disable quotes -- CSP keywords require ASCII single quotes inside JavaScript string literals. */

const KLARNA_ORIGINS = [
  'https://js.klarna.com',
  'https://x.klarnacdn.net',
  'https://*.klarnaevt.com'
] as const

const MICROSOFT_TRACKING_ORIGINS = [
  'https://bat.bing.com',
  'https://c.bing.com',
  'https://*.clarity.ms'
] as const

const META_PIXEL_SCRIPT_ORIGINS = [
  'https://connect.facebook.net'
] as const

const META_PIXEL_EVENT_ORIGINS = [
  'https://www.facebook.com',
  'https://mpc2-prod-25-is5qnl632q-wl.a.run.app',
  'https://5z-2b6b7616f94640c2840d1841e1ac24c3.ecs.us-east-1.on.aws'
] as const

/** Meta Pixel (fbevents) creates a hidden iframe to www.facebook.com. */
const META_PIXEL_FRAME_ORIGINS = [
  'https://www.facebook.com'
] as const

const PINTEREST_TAG_SCRIPT_ORIGINS = [
  'https://s.pinimg.com'
] as const

const PINTEREST_TAG_EVENT_ORIGINS = [
  'https://s.pinimg.com',
  'https://ct.pinterest.com'
] as const

const GOOGLE_ADS_ORIGINS = [
  'https://ad.doubleclick.net',
  'https://googleads.g.doubleclick.net',
  'https://www.googleadservices.com',
  'https://pagead2.googlesyndication.com'
] as const

const GA4_COLLECTION_ORIGINS = [
  'https://*.google-analytics.com',
  'https://*.analytics.google.com'
] as const

const GA4_ADVERTISING_ORIGINS = [
  'https://*.g.doubleclick.net',
  'https://*.google.com',
  'https://*.google.no'
] as const

const KLARNA_ASSET_ORIGINS = ['https://x.klarnacdn.net'] as const

const VERCEL_LIVE_ORIGINS = ['https://vercel.live'] as const

/**
 * @vercel/analytics + @vercel/speed-insights load from this host in
 * development (script.debug.js). Production uses first-party
 * /_vercel/insights and /_vercel/speed-insights under 'self'.
 */
const VERCEL_ANALYTICS_SCRIPT_ORIGINS = [
  'https://va.vercel-scripts.com'
] as const

/**
 * Development ingest hosts for Speed Insights / Analytics when the
 * debug scripts are served from va.vercel-scripts.com.
 */
const VERCEL_ANALYTICS_CONNECT_ORIGINS = [
  'https://vitals.vercel-insights.com',
  'https://vitals.vercel-analytics.com'
] as const

/**
 * Vercel BotID / Kasada fingerprinting error sink, evidenced from
 * production report-only connect-src violations on the homepage.
 */
const BOTID_KASADA_CONNECT_ORIGINS = [
  'https://reporting.cdndex.io',
  'https://*.cdndex.io'
] as const

/**
 * Shopify Customer Privacy / consent-tracking API loaded by
 * ShopifyCustomerPrivacyBridge after Cookiebot choice.
 * connect-src hosts are evidenced from production report-only
 * violations: checkout GraphQL + Monorail produce.
 */
const SHOPIFY_CONSENT_SCRIPT_ORIGINS = [
  'https://cdn.shopify.com'
] as const

const SHOPIFY_CONSENT_CONNECT_ORIGINS = [
  'https://kasse.utekos.no',
  'https://monorail-edge.shopifysvc.com'
] as const

/** Privacy-enhanced YouTube embeds used by the storefront video. */
const VIDEO_FRAME_ORIGINS = [
  'https://www.youtube-nocookie.com'
] as const

function joinOrigins(origins: readonly string[]): string {
  return origins.join(' ')
}

export function buildReportOnlyCsp(): string {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    ...KLARNA_ORIGINS,
    ...TAG_GATEWAY_ORIGINS,
    ...MICROSOFT_TRACKING_ORIGINS,
    ...META_PIXEL_SCRIPT_ORIGINS,
    ...PINTEREST_TAG_SCRIPT_ORIGINS,
    ...GOOGLE_ADS_ORIGINS,
    ...SHOPIFY_CONSENT_SCRIPT_ORIGINS,
    ...VERCEL_LIVE_ORIGINS,
    ...VERCEL_ANALYTICS_SCRIPT_ORIGINS
  ]

  const connectSrc = [
    "'self'",
    ...KLARNA_ORIGINS,
    ...TAG_GATEWAY_ORIGINS,
    ...MICROSOFT_TRACKING_ORIGINS,
    ...META_PIXEL_SCRIPT_ORIGINS,
    ...META_PIXEL_EVENT_ORIGINS,
    ...PINTEREST_TAG_EVENT_ORIGINS,
    ...GOOGLE_ADS_ORIGINS,
    ...SHOPIFY_CONSENT_CONNECT_ORIGINS,
    ...VERCEL_LIVE_ORIGINS,
    ...VERCEL_ANALYTICS_CONNECT_ORIGINS,
    ...BOTID_KASADA_CONNECT_ORIGINS,
    ...GA4_COLLECTION_ORIGINS,
    ...GA4_ADVERTISING_ORIGINS,
    'https://*.ingest.sentry.io',
    'https://*.ingest.de.sentry.io'
  ]

  // Kasada fingerprinting plays data:audio media; without media-src
  // it falls through default-src 'self' and floods report-only CSP.
  const mediaSrc = ["'self'", 'data:', 'blob:']

  const imgSrc = [
    "'self'",
    'data:',
    'blob:',
    ...TAG_GATEWAY_ORIGINS,
    ...MICROSOFT_TRACKING_ORIGINS,
    ...META_PIXEL_EVENT_ORIGINS,
    ...PINTEREST_TAG_EVENT_ORIGINS,
    ...GOOGLE_ADS_ORIGINS,
    ...GA4_COLLECTION_ORIGINS,
    ...GA4_ADVERTISING_ORIGINS,
    'https://cdn.sanity.io',
    'https://cdn.shopify.com'
  ]

  const frameSrc = [
    "'self'",
    ...KLARNA_ORIGINS,
    ...TAG_GATEWAY_ORIGINS,
    ...META_PIXEL_FRAME_ORIGINS,
    ...VIDEO_FRAME_ORIGINS,
    ...VERCEL_LIVE_ORIGINS
  ]

  return [
    "default-src 'self'",
    `script-src ${joinOrigins(scriptSrc)}`,
    `style-src ${joinOrigins(["'self'", "'unsafe-inline'", ...KLARNA_ASSET_ORIGINS])}`,
    `font-src ${joinOrigins(["'self'", 'data:', ...KLARNA_ASSET_ORIGINS])}`,
    "object-src 'none'",
    "base-uri 'self'",
    `connect-src ${joinOrigins(connectSrc)}`,
    `img-src ${joinOrigins(imgSrc)}`,
    `media-src ${joinOrigins(mediaSrc)}`,
    `frame-src ${joinOrigins(frameSrc)}`,
    "worker-src 'self' blob:",
    'report-uri /api/security/csp-report'
  ].join('; ')
}
