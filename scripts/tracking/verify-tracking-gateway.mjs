import { pathToFileURL } from 'node:url'

const GTM_ID = 'GTM-5TWMJQFP'
const CUSTOM_LOADER_PATH = '/__sgtm/apgqnrnczg.js'
const CUSTOM_LOADER_QUERY =
  'ds4bay5=Dh5eKSYjXFIzLS4kIyghQRFHUUBDSBUJWg8XCxkBAkkJFUUdHR5MSDglEAkGAw%3D%3D'
const DEFAULT_BASE_URL = 'http://localhost:3000'
const REQUEST_TIMEOUT_MS = 15_000

function normalizeBaseUrl(value) {
  return value.trim().replace(/\/$/, '')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function fetchGateway(fetchImpl, url) {
  return fetchImpl(url, {
    headers: {
      'user-agent': 'Utekos tracking gateway smoke/1.0'
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  })
}

export async function verifyTrackingGateway({
  baseUrl = DEFAULT_BASE_URL,
  fetchImpl = fetch
} = {}) {
  const origin = normalizeBaseUrl(baseUrl)
  const gtmUrl = `${origin}${CUSTOM_LOADER_PATH}?${CUSTOM_LOADER_QUERY}`
  const healthUrl = `${origin}/__sgtm/healthy`

  const [gtmResponse, healthResponse] = await Promise.all([
    fetchGateway(fetchImpl, gtmUrl),
    fetchGateway(fetchImpl, healthUrl)
  ])
  const gtmBody = await gtmResponse.text()
  const healthBody = await healthResponse.text()
  const gtmContentType = gtmResponse.headers.get('content-type') ?? ''
  const cacheControl = healthResponse.headers.get('cache-control') ?? ''
  const vercelCache = healthResponse.headers.get('x-vercel-cache') ?? ''

  assert(gtmResponse.status === 200, `${gtmUrl} returned ${gtmResponse.status}`)
  assert(
    /javascript/i.test(gtmContentType),
    `${gtmUrl} did not return JavaScript: ${gtmContentType || 'missing content-type'}`
  )
  assert(
    gtmBody.includes(GTM_ID),
    `${gtmUrl} did not contain the expected GTM container id`
  )
  assert(
    healthResponse.status === 200,
    `${healthUrl} returned ${healthResponse.status}: ${healthBody.slice(0, 160)}`
  )
  assert(
    /(?:^|,)\s*no-store(?:,|$)/i.test(cacheControl),
    `${healthUrl} is missing Cache-Control: no-store`
  )
  assert(
    vercelCache.toUpperCase() !== 'HIT',
    `${healthUrl} unexpectedly returned x-vercel-cache: HIT`
  )

  return {
    gtm: {
      status: gtmResponse.status,
      contentType: gtmContentType,
      bytes: Buffer.byteLength(gtmBody)
    },
    sgtm: {
      status: healthResponse.status,
      cacheControl,
      vercelCache: vercelCache || null,
      body: healthBody.trim()
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const baseUrl = process.env.TRACKING_GATEWAY_BASE_URL || process.argv[2] || DEFAULT_BASE_URL

  verifyTrackingGateway({ baseUrl })
    .then(result => {
      console.log(JSON.stringify({ ok: true, baseUrl, ...result }, null, 2))
    })
    .catch(error => {
      console.error(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    })
}
