const DEFAULT_AUDIT_CACHE_TTL_MS = 30_000

const SEVERITY_WEIGHTS = Object.freeze({
  critical: 50,
  high: 40,
  medium: 30,
  low: 20,
  info: 10
})


const DIAGNOSIS_INTENTS = Object.freeze([
  {
    name: 'conversion_tracking',
    areas: ['conversion_tracking', 'attribution', 'uet', 'local_tracking', 'deduplication'],
    tokens: ['conversion', 'conversions', 'konvertering', 'konverteringer', 'qualified', 'kvalifisert', 'kvalifiserte', 'goal', 'goals', 'uet', 'msclkid', 'tracking', 'attribution', 'attribusjon', 'purchase', 'kjop', 'click', 'clicks', 'klikk'],
    codeTokens: ['CONVERSION', 'UET', 'MSCLKID', 'CLICKS', 'ATTRIBUTION', 'PURCHASE']
  },
  {
    name: 'merchant',
    areas: ['merchant', 'merchant_center', 'shopping', 'catalog', 'feed'],
    tokens: ['merchant', 'merchantcenter', 'shopping', 'catalog', 'catalogue', 'feed', 'product', 'products', 'produkt', 'produkter', 'disapproved', 'avvist', 'offer', 'offers'],
    codeTokens: ['MERCHANT', 'SHOPPING', 'PRODUCT', 'CATALOG', 'FEED', 'OFFER']
  },
  {
    name: 'delivery',
    areas: ['delivery', 'campaign', 'campaigns', 'account'],
    tokens: ['delivery', 'levering', 'impression', 'impressions', 'visninger', 'campaign', 'campaigns', 'kampanje', 'kampanjer', 'spend', 'forbruk', 'traffic', 'trafikk'],
    codeTokens: ['DELIVERY', 'CAMPAIGN', 'IMPRESSION', 'SPEND']
  },
  {
    name: 'budget',
    areas: ['budget', 'delivery', 'campaign'],
    tokens: ['budget', 'budsjett', 'limited', 'begrenset', 'spend', 'forbruk'],
    codeTokens: ['BUDGET']
  },
  {
    name: 'targeting',
    areas: ['targeting', 'audience', 'keyword'],
    tokens: ['targeting', 'malretting', 'audience', 'publikum', 'keyword', 'keywords', 'sokeord', 'negative'],
    codeTokens: ['TARGET', 'AUDIENCE', 'KEYWORD', 'NEGATIVE']
  }
])

const DIAGNOSIS_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'at',
  'av',
  'de',
  'den',
  'det',
  'er',
  'for',
  'fra',
  'har',
  'hva',
  'hvorfor',
  'i',
  'ikke',
  'is',
  'med',
  'missing',
  'of',
  'og',
  'på',
  'som',
  'the',
  'to',
  'why'
])

export function createMicrosoftAdsAuditCache({
  collect,
  ttlMs = DEFAULT_AUDIT_CACHE_TTL_MS,
  now = Date.now
}) {
  if (typeof collect !== 'function') {
    throw new TypeError('Microsoft Ads audit cache requires a collect function.')
  }

  if (!Number.isFinite(ttlMs) || ttlMs < 0) {
    throw new TypeError('Microsoft Ads audit cache ttlMs must be a non-negative number.')
  }

  if (typeof now !== 'function') {
    throw new TypeError('Microsoft Ads audit cache now must be a function.')
  }

  let value = null
  let expiresAt = 0
  let inflight = null

  async function get({ refresh = false } = {}) {
    const currentTime = Number(now())

    if (!refresh && value !== null && currentTime < expiresAt) {
      return value
    }

    if (inflight) {
      return inflight
    }

    inflight = Promise.resolve()
      .then(() => collect())
      .then(result => {
        value = result
        expiresAt = Number(now()) + ttlMs
        return result
      })
      .finally(() => {
        inflight = null
      })

    return inflight
  }

  function clear() {
    value = null
    expiresAt = 0
  }

  function inspect() {
    return {
      hasValue: value !== null,
      expiresAt,
      inflight: Boolean(inflight)
    }
  }

  return { get, clear, inspect }
}

export function rankMicrosoftAdsDiagnosisFindings(query, findings, { limit } = {}) {
  const input = Array.isArray(findings) ? findings : []
  const queryText = normalizeSearchText(query)
  const queryTokens = tokenizeDiagnosis(queryText)
  const normalizedLimit = normalizeOptionalLimit(limit, input.length)
  const intent = classifyMicrosoftAdsDiagnosisIntent(queryText)

  return input
    .map(finding => {
      const searchText = normalizeSearchText([
        finding?.code,
        finding?.area,
        finding?.title,
        finding?.summary,
        finding?.entity?.type,
        finding?.entity?.id,
        finding?.entity?.name,
        finding?.diagnosis?.rootCause,
        finding?.diagnosis?.rationale,
        finding?.remediation?.summary,
        ...(finding?.remediation?.steps ?? []),
        ...flattenEvidence(finding?.evidence)
      ].filter(Boolean).join(' '))

      const searchTokens = new Set(tokenizeDiagnosis(searchText))
      const tokenOverlap = queryTokens.filter(token => searchTokens.has(token)).length
      const phraseBonus = queryText.length >= 4 && searchText.includes(queryText) ? 220 : 0
      const codeBonus = queryTokens.some(token =>
        normalizeSearchText(finding?.code).includes(token)
      )
        ? 35
        : 0
      const areaBonus = queryTokens.some(token =>
        normalizeSearchText(finding?.area).includes(token)
      )
        ? 25
        : 0
      const severityScore = SEVERITY_WEIGHTS[finding?.severity] ?? 0
      const intentAreaBonus = scoreIntentArea(finding?.area, intent)
      const intentCodeBonus = scoreIntentCode(finding?.code, intent)
      const diagnosticScore =
        phraseBonus +
        tokenOverlap * 60 +
        codeBonus +
        areaBonus +
        severityScore +
        intentAreaBonus +
        intentCodeBonus

      return {
        ...finding,
        diagnosticScore,
        diagnosticMatch: {
          tokenOverlap,
          queryTokenCount: queryTokens.length,
          primaryIntent: intent.primaryIntent,
          matchedIntents: intent.matchedIntents,
          intentAreaBonus,
          intentCodeBonus
        }
      }
    })
    .sort((left, right) => {
      if (right.diagnosticScore !== left.diagnosticScore) {
        return right.diagnosticScore - left.diagnosticScore
      }

      const severityDelta =
        (SEVERITY_WEIGHTS[right.severity] ?? 0) -
        (SEVERITY_WEIGHTS[left.severity] ?? 0)

      if (severityDelta !== 0) {
        return severityDelta
      }

      return String(left.code ?? '').localeCompare(String(right.code ?? ''))
    })
    .slice(0, normalizedLimit)
}

export function classifyMicrosoftAdsDiagnosisIntent(query) {
  const text = normalizeSearchText(query)
  const tokens = new Set(tokenizeDiagnosis(text))
  const scored = DIAGNOSIS_INTENTS.map(intent => {
    let score = intent.tokens.reduce(
      (total, token) => total + (tokens.has(normalizeSearchText(token)) ? 1 : 0),
      0
    )

    if (
      intent.name === 'conversion_tracking' &&
      hasAnyToken(tokens, ['click', 'clicks', 'klikk']) &&
      hasAnyToken(tokens, ['conversion', 'conversions', 'konvertering', 'konverteringer', 'qualified', 'kvalifiserte']) &&
      hasAnyToken(tokens, ['zero', 'no', 'none', 'ingen', 'null'])
    ) {
      score += 8
    }

    return { ...intent, score }
  })
    .filter(intent => intent.score > 0)
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))

  return {
    primaryIntent: scored[0]?.name ?? 'general',
    matchedIntents: scored.map(intent => intent.name),
    scored
  }
}

function scoreIntentArea(area, intentResult) {
  const normalizedArea = normalizeSearchText(area)
  if (!normalizedArea) return 0

  let bonus = 0
  for (let index = 0; index < intentResult.scored.length; index += 1) {
    const intent = intentResult.scored[index]
    if (!intent.areas.some(candidate => normalizedArea.includes(normalizeSearchText(candidate)))) continue
    bonus = Math.max(bonus, index === 0 ? 450 : 180)
  }
  return bonus
}

function scoreIntentCode(code, intentResult) {
  const normalizedCode = String(code ?? '').toUpperCase()
  let bonus = 0
  for (let index = 0; index < intentResult.scored.length; index += 1) {
    const intent = intentResult.scored[index]
    if (!intent.codeTokens.some(token => normalizedCode.includes(token))) continue
    bonus = Math.max(bonus, index === 0 ? 140 : 60)
  }
  return bonus
}

function hasAnyToken(tokens, candidates) {
  return candidates.some(candidate => tokens.has(normalizeSearchText(candidate)))
}

export function buildMicrosoftAdsReportRequest(input, config, now = Date.now) {
  const reportType = requireReportType(input?.reportType)
  const aggregation = requireNonEmptyString(input?.aggregation ?? 'Summary', 'aggregation')
  const reportTimeZone = requireNonEmptyString(
    input?.reportTimeZone ?? 'BrusselsCopenhagenMadridParis',
    'reportTimeZone'
  )
  const columns = normalizeColumns(input?.columns, aggregation)
  const scope = normalizeScope(input?.scope, config)
  const time = normalizeReportTime(input)
  const filter = normalizeOptionalObject(input?.filter, 'filter')
  const timestamp = Number(now())

  if (!Number.isFinite(timestamp)) {
    throw new TypeError('Microsoft Ads report clock returned an invalid timestamp.')
  }

  return {
    ExcludeColumnHeaders: false,
    ExcludeReportFooter: true,
    ExcludeReportHeader: true,
    Format: 'Csv',
    FormatVersion: '2.0',
    ReportName: `utekos-mcp-${slugReportType(reportType)}-${Math.trunc(timestamp)}`,
    ReturnOnlyCompleteData: Boolean(input?.returnOnlyCompleteData),
    Type: reportType,
    Aggregation: aggregation,
    Columns: columns,
    ...(filter ? { Filter: filter } : {}),
    Scope: scope,
    Time: {
      ...time,
      ReportTimeZone: reportTimeZone
    }
  }
}

export function sanitizeMicrosoftAdsReportResult(result) {
  if (!result || typeof result !== 'object') {
    return result
  }

  const { allRows: _allRows, status: _status, ...safe } = result

  return {
    ...safe,
    ...(result.status
      ? {
          status: {
            Status: result.status.Status ?? null
          }
        }
      : {})
  }
}

function normalizeColumns(columns, aggregation) {
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new TypeError('Microsoft Ads report columns must be a non-empty array.')
  }

  const normalized = [...new Set(columns.map(column => requireNonEmptyString(column, 'column')))]

  if (aggregation !== 'Summary' && !normalized.includes('TimePeriod')) {
    normalized.unshift('TimePeriod')
  }

  return normalized
}

function normalizeScope(scope, config) {
  if (scope !== undefined && scope !== null) {
    return normalizeOptionalObject(scope, 'scope')
  }

  const accountId = requireNonEmptyString(config?.accountId, 'accountId')
  return { AccountIds: [accountId] }
}

function normalizeReportTime(input) {
  const predefinedTime = optionalNonEmptyString(input?.predefinedTime)
  const customStartDate = optionalNonEmptyString(input?.customStartDate)
  const customEndDate = optionalNonEmptyString(input?.customEndDate)
  const hasCustomDate = Boolean(customStartDate || customEndDate)

  if (predefinedTime && hasCustomDate) {
    throw new Error('Use either predefinedTime or custom dates, not both.')
  }

  if (hasCustomDate && (!customStartDate || !customEndDate)) {
    throw new Error('Both customStartDate and customEndDate are required for a custom report range.')
  }

  if (!hasCustomDate) {
    return { PredefinedTime: predefinedTime ?? 'Last30Days' }
  }

  const start = parseIsoDate(customStartDate, 'customStartDate')
  const end = parseIsoDate(customEndDate, 'customEndDate')

  if (start.date.getTime() > end.date.getTime()) {
    throw new Error('customStartDate must be on or before customEndDate.')
  }

  return {
    CustomDateRangeStart: start.parts,
    CustomDateRangeEnd: end.parts
  }
}

function parseIsoDate(value, field) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError(`${field} must use YYYY-MM-DD format.`)
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new TypeError(`${field} is not a valid calendar date.`)
  }

  return {
    date,
    parts: {
      Day: date.getUTCDate(),
      Month: date.getUTCMonth() + 1,
      Year: date.getUTCFullYear()
    }
  }
}

function requireReportType(value) {
  const reportType = requireNonEmptyString(value, 'reportType')

  if (!/^[A-Za-z][A-Za-z0-9]*ReportRequest$/.test(reportType)) {
    throw new Error('Microsoft Ads reportType must be a Reporting v13 *ReportRequest type.')
  }

  return reportType
}

function normalizeOptionalObject(value, field) {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`Microsoft Ads report ${field} must be an object.`)
  }

  return value
}

function normalizeOptionalLimit(value, fallback) {
  if (value === undefined || value === null) {
    return fallback
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError('Diagnosis limit must be a non-negative integer.')
  }

  return value
}

function requireNonEmptyString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`Microsoft Ads ${field} must be a non-empty string.`)
  }

  return value.trim()
}

function optionalNonEmptyString(value) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  return requireNonEmptyString(value, 'value')
}

function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenizeDiagnosis(value) {
  return [...new Set(
    normalizeSearchText(value)
      .split(' ')
      .filter(token => token.length >= 2 && !DIAGNOSIS_STOP_WORDS.has(token))
  )]
}

function flattenEvidence(evidence) {
  if (!Array.isArray(evidence)) {
    return []
  }

  return evidence.flatMap(item => [
    item?.source,
    item?.key,
    typeof item?.value === 'string' || typeof item?.value === 'number'
      ? String(item.value)
      : JSON.stringify(item?.value ?? null),
    item?.note
  ])
}

function slugReportType(value) {
  return value
    .replace(/ReportRequest$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}
