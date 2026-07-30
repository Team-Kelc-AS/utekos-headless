#!/usr/bin/env node

// PDP performance baseline harness (KRI-6).
//
// Measures the reference routes in both hard-reload and client-navigation
// mode and writes a machine-readable report. The same script is the
// after-measurement tool for KRI-11, so the metric definitions must not
// change between runs.

import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { z } from 'zod'

const DEFAULT_BASE_URL = 'https://utekos.no'
const HYDRATION_SETTLE_MS = 5_000
const NAVIGATION_TIMEOUT_MS = 45_000
const CONSENT_TIMEOUT_MS = 10_000

const VIEWPORT = { width: 1440, height: 900 }
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' +
  ' (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

const CONSENT_DECLINE_SELECTOR =
  '#CybotCookiebotDialogBodyButtonDecline'
const NEWSLETTER_DISMISSAL_KEY =
  'utekos-newsletter-modal-dismissed-session'

const PRODUCT_LIST_PATH = '/produkter'

const REFERENCE_ROUTES = [
  {
    id: 'techdown-plain',
    label: 'utekos-techdown uten variant',
    path: '/produkter/utekos-techdown',
    handle: 'utekos-techdown'
  },
  {
    id: 'techdown-variant',
    label: 'utekos-techdown med eksplisitt ?variant',
    path:
      '/produkter/utekos-techdown' +
      '?variant=gid%3A%2F%2Fshopify%2FProductVariant%2F46944403882232',
    handle: 'utekos-techdown',
    clientNavigation: false
  },
  {
    id: 'comfyrobe',
    label: 'comfyrobe (enklere variantsett)',
    path: '/produkter/comfyrobe',
    handle: 'comfyrobe'
  }
]

const OPTIONS_SCHEMA = z.object({
  baseUrl: z
    .string()
    .trim()
    .url()
    .refine(
      value =>
        ['http:', 'https:'].includes(new URL(value).protocol),
      { message: 'base-url must use http or https' }
    )
    .refine(
      value => {
        const url = new URL(value)
        return (
          !url.username &&
          !url.password &&
          !url.search &&
          !url.hash
        )
      },
      {
        message:
          'base-url must not contain credentials, a query, or a fragment'
      }
    ),
  outDir: z.string().trim().min(1),
  label: z.string().regex(/^[a-z0-9][a-z0-9_-]*$/i),
  cpuThrottle: z.number().positive().max(20),
  runs: z.number().int().min(1).max(20)
})

export function parseArgs(argv) {
  const args = new Map()
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue
    const [key, value = 'true'] = raw.slice(2).split('=')
    args.set(key, value)
  }
  return OPTIONS_SCHEMA.parse({
    baseUrl: (args.get('base-url') ?? DEFAULT_BASE_URL).replace(
      /\/$/,
      ''
    ),
    outDir: args.get('out') ?? 'output/perf',
    label: args.get('label') ?? 'baseline',
    cpuThrottle: Number(args.get('cpu-throttle') ?? '4'),
    runs: Number(args.get('runs') ?? '3')
  })
}

/**
 * Reassembles the RSC flight stream from the inline `self.__next_f.push`
 * bootstrap scripts. Measuring the reassembled stream — not the hydrated
 * DOM — is what makes payload numbers comparable across refactors.
 */
function extractFlightStream(html) {
  const rows = [
    ...html.matchAll(
      /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g
    )
  ].map(match => JSON.parse(match[1]))

  return { rows, stream: rows.join('') }
}

function measureDehydratedQueries(stream) {
  const queryHashes = []
  let serializedBytes = 0

  for (const row of stream.split('\n')) {
    if (!row.includes('queryHash')) continue

    const start = row.indexOf('"queries":[')
    if (start === -1) continue

    let depth = 0
    let end = row.length
    for (
      let index = start + '"queries":'.length;
      index < row.length;
      index += 1
    ) {
      const char = row[index]
      if (char === '[') depth += 1
      else if (char === ']') {
        depth -= 1
        if (depth === 0) {
          end = index + 1
          break
        }
      }
    }

    const serialized = row.slice(start, end)
    serializedBytes += Buffer.byteLength(serialized, 'utf8')
    for (const match of serialized.matchAll(
      /"queryHash":"((?:[^"\\]|\\.)*)"/g
    )) {
      queryHashes.push(match[1].replace(/\\"/g, '"'))
    }
  }

  return {
    dehydratedQueryCount: queryHashes.length,
    dehydratedQueryHashes: queryHashes,
    dehydratedQueryBytes: serializedBytes
  }
}

function measurePayload(html) {
  const { rows, stream } = extractFlightStream(html)
  const dehydrated = measureDehydratedQueries(stream)

  return {
    htmlBytes: Buffer.byteLength(html, 'utf8'),
    flightRowCount: rows.length,
    flightStreamBytes: Buffer.byteLength(stream, 'utf8'),
    ...dehydrated,
    productGidCount: new Set(
      html.match(/gid:\/\/shopify\/Product\/\d+/g) ?? []
    ).size,
    variantGidCount: new Set(
      html.match(/gid:\/\/shopify\/ProductVariant\/\d+/g) ?? []
    ).size,
    variantMetaobjectRefCount: (html.match(/bridgeFor/g) ?? [])
      .length
  }
}

function isScript(entry) {
  return entry.resourceType === 'script'
}

function isNextChunk(entry) {
  return entry.url.includes('/_next/static/chunks/')
}

function sumBy(entries, key) {
  return entries.reduce(
    (total, entry) => total + (entry[key] ?? 0),
    0
  )
}

function summarizeScripts(requests) {
  const scripts = requests.filter(isScript)
  const firstParty = scripts.filter(isNextChunk)
  const thirdParty = scripts.filter(entry => !isNextChunk(entry))

  return {
    scriptRequestCount: scripts.length,
    firstPartyChunkCount: firstParty.length,
    firstPartyTransferredBytes: sumBy(
      firstParty,
      'transferredBytes'
    ),
    firstPartyUncompressedBytes: sumBy(
      firstParty,
      'uncompressedBytes'
    ),
    thirdPartyScriptCount: thirdParty.length,
    thirdPartyTransferredBytes: sumBy(
      thirdParty,
      'transferredBytes'
    )
  }
}

/**
 * The PDP loads authoritative product data through a Server Action used as
 * a TanStack `queryFn`. Those requests are POSTs to the page URL carrying a
 * `next-action` header, so they cannot be identified by URL alone.
 */
export function summarizeRouteRequests(requests, origin) {
  const sameOrigin = requests.filter(entry =>
    entry.url.startsWith(origin)
  )

  const serverActions = sameOrigin.filter(
    entry => entry.requestHeaders['next-action'] !== undefined
  )
  const rscFetches = sameOrigin.filter(
    entry =>
      entry.requestHeaders.rsc === '1' &&
      entry.requestHeaders['next-router-prefetch'] === undefined
  )
  const rscPrefetches = sameOrigin.filter(
    entry =>
      entry.requestHeaders['next-router-prefetch'] !== undefined
  )

  const describe = entry => ({
    method: entry.method,
    pathname: new URL(entry.url).pathname,
    status: entry.status,
    transferredBytes: entry.transferredBytes,
    vercelCache:
      entry.responseHeaders?.['x-vercel-cache'] ?? null
  })

  return {
    serverActionRequestCount: serverActions.length,
    serverActionRequests: serverActions.map(describe),
    rscFetchCount: rscFetches.length,
    rscFetchBytes: sumBy(rscFetches, 'transferredBytes'),
    rscFetchRequests: rscFetches.map(describe),
    rscPrefetchCount: rscPrefetches.length,
    rscPrefetchBytes: sumBy(rscPrefetches, 'transferredBytes'),
    sameOriginRequestCount: sameOrigin.length
  }
}

function createCollector(page) {
  const requests = []
  const pending = new Map()

  page.on('request', request => {
    const entry = {
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      requestHeaders: request.headers(),
      status: null,
      responseHeaders: null,
      transferredBytes: null,
      uncompressedBytes: null
    }
    requests.push(entry)
    pending.set(request, entry)
  })

  page.on('response', async response => {
    const request = response.request()
    const entry = pending.get(request)
    if (!entry) return

    entry.status = response.status()
    entry.responseHeaders = response.headers()

    try {
      // `sizes()` reports on-the-wire bytes; `body()` is already decoded.
      const sizes = await request.sizes()
      entry.transferredBytes = sizes.responseBodySize
    } catch {
      entry.transferredBytes = null
    }

    try {
      entry.uncompressedBytes = (
        await response.body()
      ).byteLength
    } catch {
      entry.uncompressedBytes = null
    }
  })

  return requests
}

const INSTRUMENTATION_SCRIPT = `
window.__perf = { lcp: 0, cls: 0, inp: 0, longTasks: [] }

new PerformanceObserver(list => {
  for (const entry of list.getEntries()) {
    window.__perf.lcp = Math.max(window.__perf.lcp, entry.startTime)
  }
}).observe({ type: 'largest-contentful-paint', buffered: true })

new PerformanceObserver(list => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) window.__perf.cls += entry.value
  }
}).observe({ type: 'layout-shift', buffered: true })

new PerformanceObserver(list => {
  for (const entry of list.getEntries()) {
    window.__perf.inp = Math.max(window.__perf.inp, entry.duration)
  }
}).observe({ type: 'event', durationThreshold: 16, buffered: true })

new PerformanceObserver(list => {
  for (const entry of list.getEntries()) {
    window.__perf.longTasks.push({
      startTime: entry.startTime,
      duration: entry.duration
    })
  }
}).observe({ type: 'longtask', buffered: true })
`

function summarizeLongTasks(longTasks, sinceMs = 0) {
  const relevant = longTasks.filter(
    task => task.startTime >= sinceMs
  )
  return {
    longTaskCount: relevant.length,
    longTaskTimeMs: Math.round(
      relevant.reduce((total, task) => total + task.duration, 0)
    ),
    totalBlockingTimeMs: Math.round(
      relevant.reduce(
        (total, task) => total + Math.max(0, task.duration - 50),
        0
      )
    )
  }
}

async function readPerf(page) {
  return page.evaluate(() => {
    const navigation =
      performance.getEntriesByType('navigation')[0]
    const paints = performance.getEntriesByType('paint')

    return {
      lcpMs: Math.round(window.__perf.lcp),
      cls: Number(window.__perf.cls.toFixed(4)),
      inpMs: Math.round(window.__perf.inp),
      longTasks: window.__perf.longTasks,
      firstContentfulPaintMs: Math.round(
        paints.find(
          entry => entry.name === 'first-contentful-paint'
        )?.startTime ?? 0
      ),
      domContentLoadedMs: Math.round(
        navigation?.domContentLoadedEventEnd ?? 0
      ),
      responseEndMs: Math.round(navigation?.responseEnd ?? 0),
      scriptResourceDurationMs: Math.round(
        performance
          .getEntriesByType('resource')
          .filter(entry => entry.initiatorType === 'script')
          .reduce((total, entry) => total + entry.duration, 0)
      )
    }
  })
}

const HYDRATION_WARNING_PATTERNS = [
  /hydrat/i,
  /did not match/i,
  /server rendered/i,
  /suspense boundary/i
]

function collectConsole(page) {
  const messages = []
  page.on('console', message => {
    messages.push({ type: message.type(), text: message.text() })
  })
  return messages
}

function summarizeConsole(messages) {
  return {
    hydrationWarnings: messages.filter(message =>
      HYDRATION_WARNING_PATTERNS.some(pattern =>
        pattern.test(message.text)
      )
    ),
    errors: messages.filter(message => message.type === 'error')
  }
}

async function dismissConsent(page) {
  const decline = page.locator(CONSENT_DECLINE_SELECTOR).first()
  try {
    await decline.waitFor({
      state: 'visible',
      timeout: CONSENT_TIMEOUT_MS
    })
    await decline.click({ timeout: CONSENT_TIMEOUT_MS })
    return true
  } catch {
    return false
  }
}

async function dismissOpenDialog(page) {
  const closeButtons = page.locator('[data-slot="dialog-close"]')
  const count = await closeButtons.count()
  if (count === 0) return false

  await closeButtons.first().click({ timeout: 5_000 })
  return true
}

function documentCacheState(requests, url) {
  const document = requests.find(
    entry =>
      entry.resourceType === 'document' && entry.url === url
  )
  if (!document?.responseHeaders) return null

  return {
    status: document.status,
    transferredBytes: document.transferredBytes,
    uncompressedBytes: document.uncompressedBytes,
    vercelCache:
      document.responseHeaders['x-vercel-cache'] ?? null,
    ageSeconds:
      Number(document.responseHeaders.age ?? Number.NaN) || 0,
    nextjsStaleTime:
      document.responseHeaders['x-nextjs-stale-time'] ?? null,
    nextjsPrerender:
      document.responseHeaders['x-nextjs-prerender'] ?? null,
    serverTiming:
      document.responseHeaders['server-timing'] ?? null
  }
}

async function withPage(browser, cpuThrottle, run) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    userAgent: USER_AGENT
  })
  const page = await context.newPage()
  await page.addInitScript(INSTRUMENTATION_SCRIPT)
  await page.addInitScript(key => {
    sessionStorage.setItem(key, Date.now().toString())
  }, NEWSLETTER_DISMISSAL_KEY)

  const client = await context.newCDPSession(page)
  await client.send('Emulation.setCPUThrottlingRate', {
    rate: cpuThrottle
  })

  try {
    return await run(page)
  } finally {
    await context.close()
  }
}

async function measureHardReload({
  baseUrl,
  route,
  browser,
  cpuThrottle
}) {
  return withPage(browser, cpuThrottle, async page => {
    const url = `${baseUrl}${route.path}`
    const requests = createCollector(page)
    const messages = collectConsole(page)

    const response = await page.goto(url, {
      waitUntil: 'load',
      timeout: NAVIGATION_TIMEOUT_MS
    })
    // The server response body, not the hydrated DOM.
    const html = await response.text()

    await page.waitForTimeout(HYDRATION_SETTLE_MS)
    const perf = await readPerf(page)

    return {
      routeId: route.id,
      label: route.label,
      mode: 'hard-reload',
      url,
      document: documentCacheState(requests, url),
      networkRequestCount: requests.length,
      payload: measurePayload(html),
      scripts: summarizeScripts(requests),
      routeRequests: summarizeRouteRequests(requests, baseUrl),
      lab: {
        lcpMs: perf.lcpMs,
        cls: perf.cls,
        inpMs: perf.inpMs,
        firstContentfulPaintMs: perf.firstContentfulPaintMs,
        domContentLoadedMs: perf.domContentLoadedMs,
        responseEndMs: perf.responseEndMs,
        scriptResourceDurationMs: perf.scriptResourceDurationMs,
        ...summarizeLongTasks(perf.longTasks)
      },
      ...summarizeConsole(messages)
    }
  })
}

async function measureClientNavigation({
  baseUrl,
  route,
  browser,
  cpuThrottle
}) {
  return withPage(browser, cpuThrottle, async page => {
    const url = `${baseUrl}${route.path}`

    await page.goto(`${baseUrl}${PRODUCT_LIST_PATH}`, {
      waitUntil: 'load',
      timeout: NAVIGATION_TIMEOUT_MS
    })
    // The consent dialog intercepts pointer events on the product grid.
    const consentDismissed = await dismissConsent(page)
    await page.waitForTimeout(1_500)
    const dialogDismissed = await dismissOpenDialog(page)

    // Instrument only the transition, so entry-page cost is excluded.
    const requests = createCollector(page)
    const messages = collectConsole(page)
    const transitionStart = await page.evaluate(() => {
      window.__perf.longTasks = []
      return performance.now()
    })

    const startedAt = Date.now()
    await page
      .locator(`a[href*="${route.path.split('?')[0]}"]`)
      .first()
      .click({ timeout: NAVIGATION_TIMEOUT_MS })
    await page.waitForURL(
      candidate => candidate.pathname.includes(route.handle),
      { timeout: NAVIGATION_TIMEOUT_MS }
    )
    const transitionMs = Date.now() - startedAt

    await page.waitForTimeout(HYDRATION_SETTLE_MS)
    const perf = await readPerf(page)

    return {
      routeId: route.id,
      label: route.label,
      mode: 'client-navigation',
      url,
      consentDismissed,
      dialogDismissed,
      transitionMs,
      networkRequestCount: requests.length,
      // Client navigation delivers RSC, not HTML, so payload is measured
      // from the RSC responses in routeRequests.
      scripts: summarizeScripts(requests),
      routeRequests: summarizeRouteRequests(requests, baseUrl),
      lab: {
        cls: perf.cls,
        inpMs: perf.inpMs,
        ...summarizeLongTasks(perf.longTasks, transitionStart)
      },
      ...summarizeConsole(messages)
    }
  })
}

export async function measurePdpBaseline({
  baseUrl = DEFAULT_BASE_URL,
  cpuThrottle = 4,
  runs = 3
} = {}) {
  const browser = await chromium.launch()
  const measurements = []

  try {
    for (let run = 1; run <= runs; run += 1) {
      for (const route of REFERENCE_ROUTES) {
        const measures =
          route.clientNavigation === false ?
            [measureHardReload]
          : [measureHardReload, measureClientNavigation]

        for (const measure of measures) {
          try {
            measurements.push({
              run,
              ...(await measure({
                baseUrl,
                route,
                browser,
                cpuThrottle
              }))
            })
          } catch (error) {
            measurements.push({
              run,
              routeId: route.id,
              mode: measure.name,
              failed: true,
              error: error.message
            })
          }
        }
      }
    }
  } finally {
    await browser.close()
  }

  return {
    baseUrl,
    cpuThrottle,
    runs,
    viewport: VIEWPORT,
    hydrationSettleMs: HYDRATION_SETTLE_MS,
    measurements
  }
}

function median(values) {
  if (values.length === 0) return null
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ?
      Math.round((sorted[middle - 1] + sorted[middle]) / 2)
    : sorted[middle]
}

function aggregate(report) {
  const groups = new Map()

  for (const measurement of report.measurements) {
    if (measurement.failed) continue
    const key = `${measurement.routeId}|${measurement.mode}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(measurement)
  }

  return [...groups.entries()].map(([key, items]) => {
    const [routeId, mode] = key.split('|')
    const pick = selector =>
      median(items.map(selector).filter(Number.isFinite))

    return {
      routeId,
      mode,
      samples: items.length,
      dehydratedQueryCount:
        items[0].payload?.dehydratedQueryCount ?? null,
      dehydratedQueryBytes: pick(
        item => item.payload?.dehydratedQueryBytes
      ),
      flightStreamBytes: pick(
        item => item.payload?.flightStreamBytes
      ),
      htmlBytes: pick(item => item.payload?.htmlBytes),
      variantGidCount: items[0].payload?.variantGidCount ?? null,
      serverActionRequestCount: pick(
        item => item.routeRequests?.serverActionRequestCount
      ),
      rscFetchBytes: pick(
        item => item.routeRequests?.rscFetchBytes
      ),
      firstPartyTransferredBytes: pick(
        item => item.scripts?.firstPartyTransferredBytes
      ),
      firstPartyUncompressedBytes: pick(
        item => item.scripts?.firstPartyUncompressedBytes
      ),
      lcpMs: pick(item => item.lab?.lcpMs),
      cls: median(
        items.map(item => item.lab?.cls).filter(Number.isFinite)
      ),
      totalBlockingTimeMs: pick(
        item => item.lab?.totalBlockingTimeMs
      ),
      longTaskTimeMs: pick(item => item.lab?.longTaskTimeMs),
      scriptResourceDurationMs: pick(
        item => item.lab?.scriptResourceDurationMs
      ),
      hydrationWarningCount:
        items[0].hydrationWarnings?.length ?? 0
    }
  })
}

const KIB = 1024

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const report = await measurePdpBaseline(options)
  const summary = aggregate(report)

  await mkdir(options.outDir, { recursive: true })
  const target = `${options.outDir}/pdp-${options.label}.json`
  await writeFile(
    target,
    `${JSON.stringify({ ...report, summary }, null, 2)}\n`,
    'utf8'
  )

  const columns = [
    'route',
    'mode',
    'n',
    'dehydr',
    'dehydrKiB',
    'flightKiB',
    'jsGzKiB',
    'jsRawKiB',
    'actions',
    'LCP',
    'CLS',
    'TBT'
  ]
  console.log(columns.join(' | '))
  for (const row of summary) {
    console.log(
      [
        row.routeId,
        row.mode,
        row.samples,
        row.dehydratedQueryCount ?? '-',
        row.dehydratedQueryBytes ?
          (row.dehydratedQueryBytes / KIB).toFixed(1)
        : '-',
        row.flightStreamBytes ?
          (row.flightStreamBytes / KIB).toFixed(1)
        : '-',
        (row.firstPartyTransferredBytes / KIB).toFixed(1),
        (row.firstPartyUncompressedBytes / KIB).toFixed(1),
        row.serverActionRequestCount,
        row.lcpMs ?? '-',
        row.cls ?? '-',
        row.totalBlockingTimeMs ?? '-'
      ].join(' | ')
    )
  }
  console.log(`\nWrote ${target}`)
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  await main()
}
