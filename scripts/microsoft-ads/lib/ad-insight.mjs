import { z } from 'zod'

import { MICROSOFT_ADS_ENVIRONMENTS } from './config.mjs'
import {
  createMicrosoftAdsApiHeaders,
  requestMicrosoftAdsJson
} from './http.mjs'

export const MICROSOFT_ADS_RECOMMENDATION_TYPES =
  Object.freeze([
    'ADD_BROAD_MATCH_KEYWORD',
    'CAMPAIGN_BUDGET',
    'KEYWORD',
    'REMOVE_CONFLICTING_NEGATIVE_KEYWORD',
    'RESPONSIVE_SEARCH_AD',
    'RESPONSIVE_SEARCH_AD_ASSET'
  ])

const recommendationTypeSchema = z.enum(
  MICROSOFT_ADS_RECOMMENDATION_TYPES
)

const recommendationsResponseSchema = z
  .object({
    Recommendations: z
      .array(z.object({}).passthrough())
      .optional()
      .nullable()
  })
  .passthrough()

const performanceInsightsResponseSchema = z
  .object({
    Result: z
      .array(z.object({}).passthrough())
      .optional()
      .nullable()
  })
  .passthrough()

export function getMicrosoftAdsAdInsightBaseUrl(
  environment
) {
  if (
    environment ===
    MICROSOFT_ADS_ENVIRONMENTS.sandbox
  ) {
    return 'https://adinsight.api.sandbox.bingads.microsoft.com/AdInsight/v13'
  }

  if (
    environment ===
    MICROSOFT_ADS_ENVIRONMENTS.production
  ) {
    return 'https://adinsight.api.bingads.microsoft.com/AdInsight/v13'
  }

  throw new Error(
    `Unsupported Microsoft Advertising environment: ${String(
      environment
    )}`
  )
}

export function createMicrosoftAdsAdInsightClient({
  config,
  accessToken,
  fetchImpl = globalThis.fetch,
  timeoutMs = 30_000
}) {
  const environment =
    config?.environment ??
    MICROSOFT_ADS_ENVIRONMENTS.production

  const baseUrl =
    getMicrosoftAdsAdInsightBaseUrl(
      environment
    )

  async function rawRequest(
    pathname,
    {
      method = 'POST',
      body,
      customerId = config?.customerId,
      accountId = config?.accountId,
      signal
    } = {}
  ) {
    const relativePath =
      normalizeRelativePath(pathname)

    const headers =
      createMicrosoftAdsApiHeaders({
        config,
        accessToken,
        customerId,
        accountId
      })

    return requestMicrosoftAdsJson(
      `${baseUrl}${relativePath}`,
      {
        method,
        headers,
        body,
        fetchImpl,
        timeoutMs,
        signal
      }
    )
  }

  async function retrieveRecommendations(
    recommendationTypes =
      MICROSOFT_ADS_RECOMMENDATION_TYPES,
    {
      maxCount = 2_000,
      signal
    } = {}
  ) {
    const types = z
      .array(recommendationTypeSchema)
      .min(1)
      .parse(recommendationTypes)

    const parsedMaxCount = z
      .number()
      .int()
      .min(0)
      .parse(maxCount)

    const raw = await rawRequest(
      '/Recommendations/Retrieve',
      {
        signal,
        body: {
          RecommendationTypes: types,
          MaxCount: parsedMaxCount
        }
      }
    )

    const response =
      recommendationsResponseSchema.parse(raw)

    return {
      recommendations:
        response.Recommendations ?? [],
      raw: response
    }
  }

  async function getPerformanceInsightsDetailDataByAccountId({
    entityType = 'Account',
    startDate,
    endDate,
    signal
  }) {
    const type = z
      .enum(['Account', 'Campaign'])
      .parse(entityType)

    const start =
      normalizeMicrosoftAdsDate(
        startDate,
        'startDate'
      )

    const end =
      normalizeMicrosoftAdsDate(
        endDate,
        'endDate'
      )

    validatePerformanceInsightRange(
      start.date,
      end.date
    )

    const raw = await rawRequest(
      '/PerformanceInsightsDetailData/QueryByAccountId',
      {
        signal,
        body: {
          EntityType: type,
          StartDate: start.parts,
          EndDate: end.parts
        }
      }
    )

    const response =
      performanceInsightsResponseSchema.parse(
        raw
      )

    return {
      entityType: type,
      startDate: start.iso,
      endDate: end.iso,
      insights: response.Result ?? [],
      raw: response
    }
  }

  return {
    baseUrl,
    rawRequest,
    retrieveRecommendations,
    getPerformanceInsightsDetailDataByAccountId
  }
}

export function getLastNDaysDateRange(
  days,
  now = new Date()
) {
  const count = z
    .number()
    .int()
    .min(1)
    .max(31)
    .parse(days)

  const end = startOfUtcDay(now)
  const start = new Date(end)

  start.setUTCDate(
    start.getUTCDate() - (count - 1)
  )

  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end)
  }
}

function normalizeMicrosoftAdsDate(
  value,
  field
) {
  let date

  if (value instanceof Date) {
    date = new Date(value.getTime())
  } else if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    date = new Date(
      `${value}T00:00:00.000Z`
    )
  } else {
    throw new TypeError(
      `Microsoft Advertising ${field} must be a Date or YYYY-MM-DD string.`
    )
  }

  if (Number.isNaN(date.getTime())) {
    throw new TypeError(
      `Microsoft Advertising ${field} is not a valid date.`
    )
  }

  const normalized =
    startOfUtcDay(date)

  const iso = toIsoDate(normalized)

  if (
    typeof value === 'string' &&
    value !== iso
  ) {
    throw new TypeError(
      `Microsoft Advertising ${field} is not a valid date.`
    )
  }

  return {
    date: normalized,
    iso,
    parts: {
      Day: normalized.getUTCDate(),
      Month:
        normalized.getUTCMonth() + 1,
      Year: normalized.getUTCFullYear()
    }
  }
}

function validatePerformanceInsightRange(
  start,
  end
) {
  if (start.getTime() > end.getTime()) {
    throw new Error(
      'Microsoft Advertising performance insights startDate must be on or before endDate.'
    )
  }

  const millisecondsPerDay =
    86_400_000

  const inclusiveDays =
    Math.floor(
      (end.getTime() - start.getTime()) /
        millisecondsPerDay
    ) + 1

  if (inclusiveDays > 31) {
    throw new Error(
      'Microsoft Advertising performance insights date range cannot exceed 31 days.'
    )
  }
}

function normalizeRelativePath(pathname) {
  if (
    typeof pathname !== 'string' ||
    !pathname.trim()
  ) {
    throw new TypeError(
      'Ad Insight pathname must be a non-empty string.'
    )
  }

  const value = pathname.trim()

  if (
    /^[a-z][a-z0-9+.-]*:/i.test(value) ||
    value.startsWith('//') ||
    value.includes('..')
  ) {
    throw new Error(
      'Ad Insight requests must use a relative API pathname.'
    )
  }

  return value.startsWith('/')
    ? value
    : `/${value}`
}

function startOfUtcDay(value) {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate()
    )
  )
}

function toIsoDate(value) {
  return value
    .toISOString()
    .slice(0, 10)
}