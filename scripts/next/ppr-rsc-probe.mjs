#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { z } from 'zod'
import {
  analyzeCompleteness,
  normalizeBaseUrl,
  pickHeaders,
  toSafeArtifact
} from './ppr-rsc-completeness.mjs'

export const DEFAULT_ROUTES = [
  '/',
  '/produkter',
  '/produkter/comfyrobe',
  '/produkter/utekos-techdown'
]

const REQUEST_TIMEOUT_MS = 45_000
const HEADER_NAMES = [
  'content-type',
  'content-encoding',
  'cache-control',
  'age',
  'vary',
  'x-vercel-cache',
  'x-vercel-id',
  'x-matched-path',
  'x-nextjs-prerender',
  'x-nextjs-stale-time',
  'x-nextjs-cache',
  'date',
  'etag',
  'transfer-encoding'
]

const BASE_URL_SCHEMA = z
  .string()
  .trim()
  .url()
  .refine(
    value =>
      ['http:', 'https:'].includes(new URL(value).protocol),
    { message: 'baseUrl must use http or https' }
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
        'baseUrl must not contain credentials, a query, or a fragment'
    }
  )

const PROBE_INPUT_SCHEMA = z.object({
  baseUrl: BASE_URL_SCHEMA,
  routes: z
    .array(
      z
        .string()
        .regex(/^\/(?!\/)[^\s#]*$/, {
          message:
            'routes must be origin-relative paths without fragments'
        })
    )
    .min(1)
    .max(20),
  sequences: z.number().int().min(2).max(10),
  includeFlight: z.boolean()
})

/**
 * @param {string} pathname
 * @param {'html' | 'flight'} kind
 */
export function buildRequest(pathname, kind) {
  if (kind === 'html') {
    return {
      path: pathname,
      headers: {
        'accept': 'text/html,application/xhtml+xml',
        'user-agent': 'Utekos PPR/RSC probe/1.0'
      }
    }
  }

  const separator = pathname.includes('?') ? '&' : '?'
  return {
    path: `${pathname}${separator}_rsc=kri14`,
    headers: {
      'accept': 'text/x-component',
      'rsc': '1',
      'user-agent': 'Utekos PPR/RSC probe/1.0'
    }
  }
}

/**
 * @param {Response} response
 * @param {string} body
 * @param {'html' | 'flight'} kind
 */
export function evaluateResponse(response, body, kind) {
  const headers = pickHeaders(response.headers, HEADER_NAMES)
  const completeness = analyzeCompleteness(kind, body, {
    contentType: headers['content-type']
  })
  const statusOk = response.status === 200
  return {
    status: response.status,
    headers,
    completeness,
    ok: statusOk && completeness.complete
  }
}

/**
 * @param {object} options
 */
async function fetchOnce({
  origin,
  pathname,
  kind,
  attempt,
  observation,
  fetchImpl
}) {
  const request = buildRequest(pathname, kind)
  const url = `${origin}${request.path}`
  const startedAt = new Date().toISOString()
  const startedMs = Date.now()

  try {
    const response = await fetchImpl(url, {
      headers: request.headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    })
    const body = await response.text()
    const endedAt = new Date().toISOString()
    const evaluated = evaluateResponse(response, body, kind)
    const record = {
      route: pathname,
      kind,
      attempt,
      observation,
      startedAt,
      endedAt,
      durationMs: Date.now() - startedMs,
      url,
      body,
      ...evaluated
    }
    return { ...record, artifact: toSafeArtifact(record) }
  } catch (error) {
    const endedAt = new Date().toISOString()
    const message =
      error instanceof Error ? error.message : String(error)
    const record = {
      route: pathname,
      kind,
      attempt,
      observation,
      startedAt,
      endedAt,
      durationMs: Date.now() - startedMs,
      url,
      status: 0,
      headers: {},
      body: '',
      completeness: {
        kind,
        complete: false,
        reasons: ['request_failed'],
        metrics: { bytes: 0 }
      },
      ok: false,
      error: message
    }
    return { ...record, artifact: toSafeArtifact(record) }
  }
}

/**
 * Run sequential HTML + Flight observations without claiming cache state.
 * @param {object} options
 */
export async function runPprRscProbe({
  baseUrl,
  routes = DEFAULT_ROUTES,
  sequences = 2,
  fetchImpl = fetch,
  includeFlight = true
} = {}) {
  const input = PROBE_INPUT_SCHEMA.parse({
    baseUrl,
    routes,
    sequences,
    includeFlight
  })
  const origin = normalizeBaseUrl(input.baseUrl)
  routes = input.routes
  sequences = input.sequences
  includeFlight = input.includeFlight
  const kinds =
    includeFlight ?
      /** @type {const} */ (['html', 'flight'])
    : ['html']
  /** @type {ReturnType<typeof toSafeArtifact>[]} */
  const artifacts = []
  /** @type {Array<{route: string, kind: string, attempt: number, observation: string, ok: boolean, status: number, bytes: number, vercelCache: string | null, reasons: string[], startedAt: string, endedAt: string}>} */
  const summaryRows = []
  let failures = 0

  for (let attempt = 1; attempt <= sequences; attempt += 1) {
    const observation =
      attempt === 1 ? 'initial' : `repeat-${attempt}`
    for (const route of routes) {
      for (const kind of kinds) {
        const result = await fetchOnce({
          origin,
          pathname: route,
          kind,
          attempt,
          observation,
          fetchImpl
        })
        artifacts.push(result.artifact)
        summaryRows.push({
          route: result.route,
          kind: result.kind,
          attempt,
          observation,
          ok: result.ok,
          status: result.status,
          bytes: result.completeness.metrics.bytes ?? 0,
          vercelCache: result.headers['x-vercel-cache'] ?? null,
          reasons: result.completeness.reasons,
          startedAt: result.startedAt,
          endedAt: result.endedAt
        })
        if (!result.ok) failures += 1
      }
    }
  }

  const initial = summaryRows.filter(row => row.attempt === 1)
  const repeat = summaryRows.filter(row => row.attempt === 2)

  return {
    ok: failures === 0,
    origin,
    generatedAt: new Date().toISOString(),
    sequences,
    routes,
    failureCount: failures,
    summary: summaryRows,
    initialRepeatComparison: routes.flatMap(route =>
      kinds.map(kind => {
        const initialRow = initial.find(
          row => row.route === route && row.kind === kind
        )
        const repeatRow = repeat.find(
          row => row.route === route && row.kind === kind
        )
        return {
          route,
          kind,
          initial:
            initialRow ?
              {
                ok: initialRow.ok,
                status: initialRow.status,
                bytes: initialRow.bytes,
                vercelCache: initialRow.vercelCache,
                startedAt: initialRow.startedAt
              }
            : null,
          repeat:
            repeatRow ?
              {
                ok: repeatRow.ok,
                status: repeatRow.status,
                bytes: repeatRow.bytes,
                vercelCache: repeatRow.vercelCache,
                startedAt: repeatRow.startedAt
              }
            : null,
          bytesDelta:
            initialRow && repeatRow ?
              repeatRow.bytes - initialRow.bytes
            : null,
          bothComplete: Boolean(initialRow?.ok && repeatRow?.ok)
        }
      })
    ),
    artifacts,
    correlationHint:
      'Match artifact startedAt/endedAt and x-vercel-id with Vercel runtime logs in the same window.'
  }
}

/**
 * @param {Awaited<ReturnType<typeof runPprRscProbe>>} report
 */
export function assertProbePassed(report) {
  if (!report.ok) {
    const failed = report.summary.filter(row => !row.ok)
    const details = failed
      .map(
        row =>
          `${row.observation} ${row.kind} ${row.route} status=${row.status} bytes=${row.bytes} reasons=${row.reasons.join(',') || 'none'}`
      )
      .join('; ')
    throw new Error(
      `PPR/RSC probe failed (${failed.length}): ${details}`
    )
  }
}

async function main() {
  const baseUrl =
    process.env.PPR_RSC_PROBE_BASE_URL ||
    process.env.PPR_SHELL_BASE_URL ||
    process.env.BASE_URL
  if (!baseUrl) {
    console.error(
      'Set PPR_RSC_PROBE_BASE_URL (or PPR_SHELL_BASE_URL / BASE_URL) to a reachable origin.'
    )
    process.exit(2)
  }

  const sequences = Number(
    process.env.PPR_RSC_PROBE_SEQUENCES || 2
  )
  const outPath =
    process.env.PPR_RSC_PROBE_OUT ?
      resolve(process.env.PPR_RSC_PROBE_OUT)
    : null

  const report = await runPprRscProbe({
    baseUrl,
    sequences:
      Number.isFinite(sequences) && sequences > 1 ? sequences : 2
  })

  const printable = {
    ok: report.ok,
    origin: report.origin,
    generatedAt: report.generatedAt,
    sequences: report.sequences,
    routes: report.routes,
    failureCount: report.failureCount,
    summary: report.summary,
    initialRepeatComparison: report.initialRepeatComparison,
    correlationHint: report.correlationHint,
    artifacts: report.artifacts
  }

  const json = JSON.stringify(printable, null, 2)
  console.log(json)

  if (outPath) {
    await mkdir(dirname(outPath), { recursive: true })
    await writeFile(outPath, `${json}\n`, 'utf8')
  }

  if (!report.ok) process.exitCode = 1
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
