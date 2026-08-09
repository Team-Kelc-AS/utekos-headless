#!/usr/bin/env node

import process from 'node:process'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod/v4'

const TRENDS_API_URL = 'https://api.trendsmcp.ai/api'
const TRENDS_DOCS_URL = 'https://www.trendsmcp.ai/docs'
const REQUEST_TIMEOUT_MS = 30_000
const MAX_RESPONSE_BYTES = 2_000_000

const KEYWORD_SOURCES = [
  'google search',
  'google images',
  'google news',
  'google shopping',
  'youtube',
  'tiktok',
  'reddit',
  'amazon',
  'wikipedia',
  'news volume',
  'news sentiment',
  'app downloads',
  'app rankings',
  'npm',
  'steam'
]

const TOP_TREND_TYPES = [
  'Google Trends',
  'Google News Top News',
  'TikTok Trending Hashtags',
  'TikTok Trending Searches',
  'TikTok Shop Hot Products',
  'YouTube Trending',
  'X (Twitter) Trending',
  'Reddit Hot Posts',
  'Reddit World News',
  'Wikipedia Trending',
  'Amazon Best Sellers Top Rated',
  'Amazon Best Sellers by Category',
  'App Store Top Free',
  'App Store Top Paid',
  'Google Play',
  'Top Websites',
  'Spotify Top Podcasts',
  'Steam Most Played',
  'GitHub Trending Repos',
  'IMDb MOVIEmeter',
  'Open Library Trending Books'
]

const GROWTH_PRESETS = [
  '7D',
  '14D',
  '30D',
  '1M',
  '2M',
  '3M',
  '6M',
  '9M',
  '12M',
  '1Y',
  '18M',
  '24M',
  '2Y',
  '36M',
  '3Y',
  '48M',
  '60M',
  '5Y',
  'MTD',
  'QTD',
  'YTD'
]

const TOOL_NAMES = ['get_trends', 'get_growth', 'get_top_trends']
const CATEGORY_FILTER_TYPES = new Set([
  'Amazon Best Sellers by Category',
  'Top Websites'
])

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine(isRealIsoDate, 'Date must be a real calendar date')

const keywordSchema = z.string().trim().min(1).max(500)
const keywordSourceSchema = z.enum(KEYWORD_SOURCES)
const growthSourceSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine(
    value =>
      value
        .split(',')
        .map(source => source.trim())
        .every(source => KEYWORD_SOURCES.includes(source)),
    `Use one or more documented sources: ${KEYWORD_SOURCES.join(', ')}`
  )

const customGrowthPeriodSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    recent: isoDateSchema,
    baseline: isoDateSchema
  })
  .strict()
  .refine(
    period => period.recent > period.baseline,
    'recent must be later than baseline'
  )

const growthPeriodSchema = z.union([
  z.enum(GROWTH_PRESETS),
  customGrowthPeriodSchema
])

const timeSeriesPointSchema = z
  .object({
    date: isoDateSchema,
    value: z.number(),
    volume: z.number().nullable(),
    keyword: z.string(),
    source: z.string()
  })
  .passthrough()

const timeSeriesResponseSchema = z.array(timeSeriesPointSchema)

const growthResponseSchema = z
  .object({
    search_term: z.string(),
    data_source: z.string(),
    results: z.array(
      z
        .object({
          period: z.string(),
          growth: z.number(),
          direction: z.string(),
          recent_date: isoDateSchema,
          baseline_date: isoDateSchema,
          recent_value: z.number(),
          baseline_value: z.number(),
          volume_available: z.boolean(),
          recent_volume: z.number().nullable(),
          baseline_volume: z.number().nullable(),
          volume_growth: z.number().nullable()
        })
        .passthrough()
    ),
    metadata: z
      .object({
        total_data_points: z.number().int().nonnegative(),
        calculations_completed: z.number().int().nonnegative(),
        all_successful: z.boolean()
      })
      .passthrough()
  })
  .passthrough()

const topTrendsResponseSchema = z
  .object({
    as_of_ts: z.string(),
    type: z.string(),
    limit: z.number().int().positive(),
    count: z.number().int().nonnegative(),
    data: z.array(z.json())
  })
  .passthrough()

const upstreamErrorSchema = z
  .object({
    error: z.string().optional(),
    message: z.string().optional()
  })
  .passthrough()

const proxyEnvelopeSchema = z
  .object({
    statusCode: z.number().int(),
    body: z.string(),
    isBase64Encoded: z.boolean().optional()
  })
  .passthrough()

const resultEnvelopeSchema = z.object({
  ok: z.boolean(),
  operation: z.enum(TOOL_NAMES),
  request: z.record(z.string(), z.json()),
  data: z.json().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      http_status: z.number().int().nullable(),
      retryable: z.boolean()
    })
    .optional(),
  meta: z.object({
    provider: z.literal('TrendsMCP'),
    api_url: z.literal(TRENDS_API_URL),
    docs_url: z.literal(TRENDS_DOCS_URL),
    fetched_at: z.string()
  })
})

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true
}

class TrendsMcpError extends Error {
  constructor(
    code,
    message,
    { httpStatus = null, retryable = false } = {}
  ) {
    super(message)
    this.name = 'TrendsMcpError'
    this.code = code
    this.httpStatus = httpStatus
    this.retryable = retryable
  }
}

function isRealIsoDate(value) {
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  )
}

function resolveApiKey(env = process.env) {
  const configured =
    env.TRENDS_MCP_API_KEY ?? env.TRENDS_MCP_BEARER_TOKEN
  if (typeof configured !== 'string') return null

  const trimmed = configured.trim()
  if (!trimmed) return null
  return trimmed.replace(/^Bearer\s+/i, '').trim() || null
}

function safeMessage(value, fallback) {
  if (typeof value !== 'string' || !value.trim()) return fallback
  return value.replace(/\s+/g, ' ').trim().slice(0, 500)
}

function parseJsonText(text, httpStatus) {
  try {
    return JSON.parse(text)
  } catch {
    throw new TrendsMcpError(
      'invalid_upstream_json',
      'TrendsMCP returned a non-JSON response.',
      { httpStatus, retryable: httpStatus >= 500 }
    )
  }
}

async function readResponseJson(response) {
  const contentLength = Number(
    response.headers.get('content-length')
  )
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_RESPONSE_BYTES
  ) {
    throw new TrendsMcpError(
      'response_too_large',
      'TrendsMCP returned a response larger than the local safety limit.',
      { httpStatus: response.status }
    )
  }

  const text = await response.text()
  if (Buffer.byteLength(text, 'utf8') > MAX_RESPONSE_BYTES) {
    throw new TrendsMcpError(
      'response_too_large',
      'TrendsMCP returned a response larger than the local safety limit.',
      { httpStatus: response.status }
    )
  }

  return parseJsonText(text, response.status)
}

function unwrapProxyEnvelope(body, httpStatus) {
  const parsed = proxyEnvelopeSchema.safeParse(body)
  if (!parsed.success) return { body, httpStatus }

  if (parsed.data.isBase64Encoded === true) {
    throw new TrendsMcpError(
      'unsupported_upstream_encoding',
      'TrendsMCP returned an unsupported encoded response.',
      {
        httpStatus: parsed.data.statusCode,
        retryable: parsed.data.statusCode >= 500
      }
    )
  }

  if (
    Buffer.byteLength(parsed.data.body, 'utf8') >
    MAX_RESPONSE_BYTES
  ) {
    throw new TrendsMcpError(
      'response_too_large',
      'TrendsMCP returned a response larger than the local safety limit.',
      { httpStatus: parsed.data.statusCode }
    )
  }

  return {
    body: parseJsonText(
      parsed.data.body,
      parsed.data.statusCode
    ),
    httpStatus: parsed.data.statusCode
  }
}

async function requestTrendsApi(
  payload,
  responseSchema,
  {
    apiKey = resolveApiKey(),
    fetchImpl = globalThis.fetch,
    signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  } = {}
) {
  if (!apiKey) {
    throw new TrendsMcpError(
      'missing_credentials',
      'Set TRENDS_MCP_API_KEY in .env.mcp.local before calling TrendsMCP.'
    )
  }

  let response
  try {
    response = await fetchImpl(TRENDS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'utekos-trends-mcp/1.0'
      },
      body: JSON.stringify(payload),
      redirect: 'error',
      cache: 'no-store',
      signal
    })
  } catch (error) {
    if (error instanceof TrendsMcpError) throw error
    const timedOut =
      error instanceof Error &&
      (error.name === 'TimeoutError' ||
        error.name === 'AbortError')
    throw new TrendsMcpError(
      timedOut ? 'upstream_timeout' : 'upstream_unreachable',
      timedOut ?
        'TrendsMCP did not respond before the timeout.'
      : 'Unable to reach TrendsMCP.',
      { retryable: true }
    )
  }

  const rawBody = await readResponseJson(response)
  const unwrapped = unwrapProxyEnvelope(rawBody, response.status)
  const body = unwrapped.body
  const httpStatus = unwrapped.httpStatus
  if (!response.ok || httpStatus < 200 || httpStatus >= 300) {
    const parsedError = upstreamErrorSchema.safeParse(body)
    const providerCode =
      parsedError.success ? parsedError.data.error : undefined
    const fallbackCode =
      httpStatus === 401 ? 'authentication_failed'
      : httpStatus === 429 ? 'rate_limited'
      : httpStatus >= 500 ? 'upstream_error'
      : 'request_rejected'

    throw new TrendsMcpError(
      providerCode || fallbackCode,
      safeMessage(
        parsedError.success ?
          parsedError.data.message
        : undefined,
        `TrendsMCP request failed with HTTP ${httpStatus}.`
      ),
      { httpStatus, retryable: httpStatus >= 500 }
    )
  }

  const parsed = responseSchema.safeParse(body)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 5)
      .map(
        issue =>
          `${issue.path.join('.') || '<root>'}:${issue.code}`
      )
      .join(', ')
    throw new TrendsMcpError(
      'invalid_upstream_response',
      `TrendsMCP returned data that does not match its documented response contract (${issues}).`
    )
  }

  return parsed.data
}

function normalizeGrowthSources(source) {
  return source
    .split(',')
    .map(value => value.trim())
    .join(', ')
}

function createMeta() {
  return {
    provider: 'TrendsMCP',
    api_url: TRENDS_API_URL,
    docs_url: TRENDS_DOCS_URL,
    fetched_at: new Date().toISOString()
  }
}

function jsonToolResult(operation, request, data) {
  const structuredContent = {
    ok: true,
    operation,
    request,
    data,
    meta: createMeta()
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(structuredContent, null, 2)
      }
    ],
    structuredContent
  }
}

function jsonToolError(operation, request, error) {
  const normalized =
    error instanceof TrendsMcpError ? error : (
      new TrendsMcpError(
        'unexpected_error',
        'Unexpected local TrendsMCP error.'
      )
    )
  const structuredContent = {
    ok: false,
    operation,
    request,
    error: {
      code: normalized.code,
      message: normalized.message,
      http_status: normalized.httpStatus,
      retryable: normalized.retryable
    },
    meta: createMeta()
  }

  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: JSON.stringify(structuredContent, null, 2)
      }
    ],
    structuredContent
  }
}

async function startServer() {
  const server = new McpServer({
    name: 'trends-mcp',
    version: '1.0.0'
  })

  server.registerTool(
    'get_trends',
    {
      title: 'Get Trends',
      description:
        'Read approximately five years of weekly trend data for one documented source and keyword. Each call uses one TrendsMCP request quota unit.',
      inputSchema: z.object({
        source: keywordSourceSchema,
        keyword: keywordSchema
      }),
      outputSchema: resultEnvelopeSchema,
      annotations: {
        title: 'Get Trends',
        ...readOnlyAnnotations
      }
    },
    async ({ source, keyword }) => {
      const request = { source, keyword }
      try {
        const data = await requestTrendsApi(
          { mode: 'get_time_series', ...request },
          timeSeriesResponseSchema
        )
        return jsonToolResult('get_trends', request, data)
      } catch (error) {
        return jsonToolError('get_trends', request, error)
      }
    }
  )

  server.registerTool(
    'get_growth',
    {
      title: 'Get Growth',
      description:
        'Read point-to-point growth for a keyword across one or more documented sources. All requested periods share one quota unit per source and keyword.',
      inputSchema: z.object({
        source: growthSourceSchema,
        keyword: keywordSchema,
        percent_growth: z
          .array(growthPeriodSchema)
          .min(1)
          .default(['12M'])
      }),
      outputSchema: resultEnvelopeSchema,
      annotations: {
        title: 'Get Growth',
        ...readOnlyAnnotations
      }
    },
    async ({ source, keyword, percent_growth }) => {
      const request = {
        source: normalizeGrowthSources(source),
        keyword,
        percent_growth
      }
      try {
        const data = await requestTrendsApi(
          { mode: 'get_growth', ...request },
          growthResponseSchema
        )
        return jsonToolResult('get_growth', request, data)
      } catch (error) {
        return jsonToolError('get_growth', request, error)
      }
    }
  )

  const topTrendsInputSchema = z
    .object({
      type: z.enum(TOP_TREND_TYPES),
      category: z.string().trim().min(1).max(200).optional(),
      limit: z.number().int().min(1).max(200).default(25),
      offset: z.number().int().nonnegative().default(0)
    })
    .superRefine((input, context) => {
      if (
        input.category &&
        !CATEGORY_FILTER_TYPES.has(input.type)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['category'],
          message:
            'category is supported only for Amazon Best Sellers by Category and Top Websites'
        })
      }
    })

  server.registerTool(
    'get_top_trends',
    {
      title: 'Get Top Trends',
      description:
        'Read one live ranked TrendsMCP feed. Each feed and pagination page uses one TrendsMCP request quota unit.',
      inputSchema: topTrendsInputSchema,
      outputSchema: resultEnvelopeSchema,
      annotations: {
        title: 'Get Top Trends',
        ...readOnlyAnnotations
      }
    },
    async ({ type, category, limit, offset }) => {
      const request = {
        type,
        ...(category ? { category } : {}),
        limit,
        offset
      }
      try {
        const data = await requestTrendsApi(
          { mode: 'get_top_trends', ...request },
          topTrendsResponseSchema
        )
        return jsonToolResult('get_top_trends', request, data)
      } catch (error) {
        return jsonToolError('get_top_trends', request, error)
      }
    }
  )

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

export {
  GROWTH_PRESETS,
  KEYWORD_SOURCES,
  MAX_RESPONSE_BYTES,
  TOOL_NAMES,
  TOP_TREND_TYPES,
  TRENDS_API_URL,
  TrendsMcpError,
  growthResponseSchema,
  normalizeGrowthSources,
  requestTrendsApi,
  resolveApiKey,
  startServer,
  timeSeriesResponseSchema,
  topTrendsResponseSchema
}
