#!/usr/bin/env node
import { pathToFileURL } from 'node:url'

const DEFAULT_ROUTES = [
  '/',
  '/produkter',
  '/produkter/comfyrobe',
  '/produkter/utekos-techdown'
]
const REQUEST_TIMEOUT_MS = 30_000

function normalizeBaseUrl(value) {
  return value.trim().replace(/\/$/, '')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

export async function verifyPprShellIntegrity({
  baseUrl,
  routes = DEFAULT_ROUTES,
  fetchImpl = fetch
} = {}) {
  assert(typeof baseUrl === 'string' && baseUrl.length > 0, 'baseUrl is required')
  const origin = normalizeBaseUrl(baseUrl)
  const results = []

  for (const route of routes) {
    const url = `${origin}${route}`
    const response = await fetchImpl(url, {
      headers: {
        accept: 'text/html',
        'user-agent': 'Utekos PPR shell integrity/1.0'
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: 'follow'
    })
    const body = await response.text()
    const lower = body.toLowerCase()
    const nextFPushes = (body.match(/self\.__next_f\.push/g) ?? []).length
    const hasHtmlClose = lower.includes('</html>')
    const looksTruncated =
      !hasHtmlClose || nextFPushes === 0 || /--\s*--\s*$/.test(body.trim())

    const entry = {
      route,
      status: response.status,
      bytes: Buffer.byteLength(body),
      nextFPushes,
      hasHtmlClose,
      vercelCache: response.headers.get('x-vercel-cache'),
      nextPrerender: response.headers.get('x-nextjs-prerender'),
      ok: response.status === 200 && !looksTruncated
    }
    results.push(entry)

    assert(
      entry.ok,
      `PPR shell integrity failed for ${route}: status=${entry.status} bytes=${entry.bytes} next_f=${entry.nextFPushes} html_close=${entry.hasHtmlClose}`
    )
  }

  return { origin, results }
}

async function main() {
  const baseUrl = process.env.PPR_SHELL_BASE_URL || process.env.BASE_URL
  if (!baseUrl) {
    console.error(
      'Set PPR_SHELL_BASE_URL or BASE_URL to a reachable deployment origin.'
    )
    process.exit(2)
  }

  const report = await verifyPprShellIntegrity({ baseUrl })
  console.log(JSON.stringify(report, null, 2))
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
