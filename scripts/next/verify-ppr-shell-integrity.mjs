#!/usr/bin/env node

import { pathToFileURL } from 'node:url'

export const DEFAULT_BASE_URL = 'https://utekos.no'

export const DEFAULT_ROUTES = [
  '/',
  '/produkter',
  '/produkter/comfyrobe',
  '/produkter/utekos-techdown'
]

const REQUEST_TIMEOUT_MS = 30_000
const OBSERVATION_PHASES = ['initial', 'repeat']

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function hasHttpProtocol(value) {
  return /^https?:\/\//i.test(value)
}

function isLocalHostname(value) {
  return /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(
    value
  )
}

export function normalizeBaseUrl(value) {
  assert(
    typeof value === 'string' &&
      value.trim().length > 0,
    'baseUrl must be a non-empty string'
  )

  const trimmed = value.trim()

  const candidate =
    hasHttpProtocol(trimmed) ?
      trimmed
    : isLocalHostname(trimmed) ?
      `http://${trimmed}`
    : `https://${trimmed}`

  const parsed = new URL(candidate)

  assert(
    parsed.protocol === 'http:' ||
      parsed.protocol === 'https:',
    `Unsupported baseUrl protocol: ${parsed.protocol}`
  )

  assert(
    parsed.username.length === 0 &&
      parsed.password.length === 0,
    'baseUrl must not contain credentials'
  )

  return parsed.origin
}

function readCliBaseUrl(args) {
  for (
    let index = 0;
    index < args.length;
    index += 1
  ) {
    const argument = args[index]

    if (argument === '--base-url') {
      const value = args[index + 1]

      assert(
        value,
        '--base-url requires a value'
      )

      return value
    }

    if (argument.startsWith('--base-url=')) {
      return argument.slice(
        '--base-url='.length
      )
    }

    if (!argument.startsWith('-')) {
      return argument
    }
  }

  return undefined
}

export function resolveBaseUrl({
  args = process.argv.slice(2),
  env = process.env
} = {}) {
  const value =
    readCliBaseUrl(args) ??
    env.PPR_SHELL_BASE_URL ??
    env.BASE_URL ??
    env.VERCEL_URL ??
    env.VERCEL_PROJECT_PRODUCTION_URL ??
    DEFAULT_BASE_URL

  return normalizeBaseUrl(value)
}

function assertSafeRoute(route) {
  assert(
    typeof route === 'string' &&
      route.startsWith('/') &&
      !route.startsWith('//'),
    `Route must be origin-relative: ${String(
      route
    )}`
  )
}

export function analyzePprShell({
  response,
  body
}) {
  const lower = body.toLowerCase()

  const nextFPushes =
    body.match(
      /self\.__next_f\.push/g
    )?.length ?? 0

  const hasBodyClose =
    lower.includes('</body>')

  const hasHtmlClose =
    lower.includes('</html>')

  const contentType =
    response.headers.get(
      'content-type'
    ) ?? ''

  const looksTruncated =
    !hasBodyClose ||
    !hasHtmlClose ||
    nextFPushes === 0 ||
    /--\s*--\s*$/.test(body.trim())

  return {
    status: response.status,
    bytes: Buffer.byteLength(body),
    contentType,
    nextFPushes,
    hasBodyClose,
    hasHtmlClose,
    vercelCache:
      response.headers.get(
        'x-vercel-cache'
      ),
    nextPrerender:
      response.headers.get(
        'x-nextjs-prerender'
      ),
    ok:
      response.status === 200 &&
      contentType
        .toLowerCase()
        .includes('text/html') &&
      !looksTruncated
  }
}

async function fetchPprShell({
  url,
  fetchImpl
}) {
  const response = await fetchImpl(url, {
    headers: {
      accept: 'text/html',
      'user-agent':
        'Utekos PPR shell integrity/2.0'
    },
    signal:
      AbortSignal.timeout(
        REQUEST_TIMEOUT_MS
      ),
    redirect: 'follow'
  })

  const body = await response.text()

  return {
    response,
    body,
    analysis: analyzePprShell({
      response,
      body
    })
  }
}

export async function verifyPprShellIntegrity({
  baseUrl,
  routes = DEFAULT_ROUTES,
  fetchImpl = fetch
} = {}) {
  const origin =
    normalizeBaseUrl(baseUrl)

  const results = []

  for (const route of routes) {
    assertSafeRoute(route)

    const url = new URL(
      route,
      `${origin}/`
    ).toString()

    for (
      const phase of OBSERVATION_PHASES
    ) {
      const {
        response,
        analysis
      } = await fetchPprShell({
        url,
        fetchImpl
      })

      const entry = {
        route,
        phase,
        requestedUrl: url,
        finalUrl:
          response.url || url,
        ...analysis
      }

      results.push(entry)

      assert(
        entry.ok,
        [
          `PPR shell integrity failed for ${route}`,
          `phase=${phase}`,
          `status=${entry.status}`,
          `content_type=${
            entry.contentType ||
            'missing'
          }`,
          `bytes=${entry.bytes}`,
          `next_f=${entry.nextFPushes}`,
          `body_close=${entry.hasBodyClose}`,
          `html_close=${entry.hasHtmlClose}`,
          `vercel_cache=${
            entry.vercelCache ??
            'missing'
          }`
        ].join(' ')
      )
    }
  }

  return {
    origin,
    routeCount: routes.length,
    observationCount:
      results.length,
    ok: results.every(
      result => result.ok
    ),
    results
  }
}

function printUsage() {
  console.log(
    `Usage:
  pnpm ppr:shell:smoke
  pnpm ppr:shell:smoke -- https://deployment.example.com
  pnpm ppr:shell:smoke -- --base-url https://deployment.example.com

Resolution order:
  1. CLI base URL
  2. PPR_SHELL_BASE_URL
  3. BASE_URL
  4. VERCEL_URL
  5. VERCEL_PROJECT_PRODUCTION_URL
  6. ${DEFAULT_BASE_URL}`
  )
}

async function main() {
  const args =
    process.argv.slice(2)

  if (
    args.includes('--help') ||
    args.includes('-h')
  ) {
    printUsage()
    return
  }

  const baseUrl =
    resolveBaseUrl({ args })

  const report =
    await verifyPprShellIntegrity({
      baseUrl
    })

  console.log(
    JSON.stringify(
      report,
      null,
      2
    )
  )
}

if (
  process.argv[1] &&
  import.meta.url ===
    pathToFileURL(
      process.argv[1]
    ).href
) {
  main().catch(error => {
    console.error(
      error instanceof Error ?
        error.message
      : error
    )

    process.exit(1)
  })
}