import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { z } from 'zod'

import { MICROSOFT_ADS_ENVIRONMENTS } from './config.mjs'
import {
  createMicrosoftAdsApiHeaders,
  redactMicrosoftAdsSecrets,
  requestMicrosoftAdsJson
} from './http.mjs'

export const MICROSOFT_ADS_DEFAULT_CAMPAIGN_REPORT_COLUMNS = Object.freeze([
  'AccountName',
  'AccountNumber',
  'AccountId',
  'CampaignName',
  'CampaignId',
  'CampaignStatus',
  'CampaignType',
  'CurrencyCode',
  'Impressions',
  'Clicks',
  'Spend',
  'ConversionsQualified',
  'AllConversionsQualified',
  'Revenue',
  'AllRevenue',
  'Goal',
  'GoalType'
])

const reportRequestSchema = z
  .object({
    Type: z.string().trim().min(1),
    Aggregation: z.string().trim().min(1),
    Columns: z.array(z.string().trim().min(1)).min(1),
    Scope: z.object({}).passthrough(),
    Time: z.object({}).passthrough(),
    ExcludeColumnHeaders: z.boolean().optional(),
    ExcludeReportFooter: z.boolean().optional(),
    ExcludeReportHeader: z.boolean().optional(),
    Format: z.string().trim().min(1).optional(),
    FormatVersion: z.string().trim().min(1).optional(),
    ReportName: z.string().trim().min(1).optional(),
    ReturnOnlyCompleteData: z.boolean().optional()
  })
  .passthrough()

const submitResponseSchema = z
  .object({
    ReportRequestId: z.union([z.string(), z.number()]).optional()
  })
  .passthrough()

const pollResponseSchema = z
  .object({
    ReportRequestStatus: z
      .object({
        Status: z.string().optional(),
        ReportDownloadUrl: z.string().optional()
      })
      .passthrough()
      .optional()
  })
  .passthrough()

export function getMicrosoftAdsReportingBaseUrl(environment) {
  if (environment === MICROSOFT_ADS_ENVIRONMENTS.sandbox) {
    return 'https://reporting.api.sandbox.bingads.microsoft.com/Reporting/v13'
  }

  if (environment === MICROSOFT_ADS_ENVIRONMENTS.production) {
    return 'https://reporting.api.bingads.microsoft.com/Reporting/v13'
  }

  throw new Error(
    `Unsupported Microsoft Advertising environment: ${String(environment)}`
  )
}

export function createMicrosoftAdsReportingClient({
  config,
  accessToken,
  fetchImpl = globalThis.fetch,
  timeoutMs = 30_000,
  pollIntervalMs = 5_000,
  maxPollAttempts = 24,
  sleepImpl = sleep
}) {
  const environment =
    config?.environment ?? MICROSOFT_ADS_ENVIRONMENTS.production
  const baseUrl = getMicrosoftAdsReportingBaseUrl(environment)

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
    const relativePath = normalizeRelativePath(pathname)
    const headers = createMicrosoftAdsApiHeaders({
      config,
      accessToken,
      customerId,
      accountId
    })

    return requestMicrosoftAdsJson(`${baseUrl}${relativePath}`, {
      method,
      headers,
      body,
      fetchImpl,
      timeoutMs,
      signal
    })
  }

  async function submitReport(reportRequest, options = {}) {
    const parsedRequest = reportRequestSchema.parse(reportRequest)
    const raw = await rawRequest('/GenerateReport/Submit', {
      ...options,
      body: { ReportRequest: parsedRequest }
    })
    const response = submitResponseSchema.parse(raw)

    if (response.ReportRequestId === undefined) {
      throw new Error(
        'Microsoft Reporting submit response did not include ReportRequestId.'
      )
    }

    return {
      reportRequestId: String(response.ReportRequestId),
      response
    }
  }

  async function pollReport(reportRequestId, options = {}) {
    const id = requireNonEmptyString(reportRequestId, 'reportRequestId')
    const raw = await rawRequest('/GenerateReport/Poll', {
      ...options,
      body: { ReportRequestId: id }
    })

    return pollResponseSchema.parse(raw)
  }

  async function waitForReport(
    reportRequestId,
    {
      signal,
      intervalMs = pollIntervalMs,
      attempts = maxPollAttempts
    } = {}
  ) {
    if (!Number.isInteger(attempts) || attempts < 1) {
      throw new TypeError('Reporting poll attempts must be a positive integer.')
    }

    let lastStatus = null

    for (let index = 0; index < attempts; index += 1) {
      if (signal?.aborted) {
        throw signal.reason ?? new Error('Microsoft Reporting poll aborted.')
      }

      const poll = await pollReport(reportRequestId, { signal })
      lastStatus = poll.ReportRequestStatus ?? null

      if (lastStatus?.Status === 'Success') {
        return {
          ok: true,
          status: lastStatus,
          attempts: index + 1
        }
      }

      if (lastStatus?.Status === 'Error') {
        throw new Error(
          `Microsoft report generation failed: ${redactMicrosoftAdsSecrets(
            JSON.stringify(lastStatus)
          )}`
        )
      }

      if (index < attempts - 1) {
        await sleepImpl(intervalMs, signal)
      }
    }

    return {
      ok: false,
      status: lastStatus,
      attempts
    }
  }

  async function downloadReportCsv(downloadUrl, { signal } = {}) {
    const url = requireHttpsUrl(downloadUrl, 'downloadUrl')
    const controller = new AbortController()
    const timeout = setTimeout(
      () =>
        controller.abort(
          new Error(`Report download timed out after ${timeoutMs} ms.`)
        ),
      timeoutMs
    )
    const combinedSignal = signal
      ? AbortSignal.any([signal, controller.signal])
      : controller.signal

    try {
      const response = await fetchImpl(url, { signal: combinedSignal })

      if (!response.ok) {
        throw new Error(
          `Microsoft report download failed with HTTP ${response.status}.`
        )
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      return decodeReportBuffer(buffer)
    } finally {
      clearTimeout(timeout)
    }
  }

  async function generateReport(
    reportRequest,
    {
      signal,
      intervalMs = pollIntervalMs,
      attempts = maxPollAttempts,
      rowLimit = null
    } = {}
  ) {
    const submitted = await submitReport(reportRequest, { signal })
    const completed = await waitForReport(submitted.reportRequestId, {
      signal,
      intervalMs,
      attempts
    })

    if (!completed.ok || !completed.status?.ReportDownloadUrl) {
      return {
        ok: false,
        reportRequestId: submitted.reportRequestId,
        status: completed.status,
        pollAttempts: completed.attempts
      }
    }

    const csv = await downloadReportCsv(
      completed.status.ReportDownloadUrl,
      { signal }
    )
    const allRows = parseMicrosoftAdsReportCsv(csv)
    const rows =
      rowLimit === null
        ? allRows
        : allRows.slice(0, normalizeRowLimit(rowLimit))

    return {
      ok: true,
      reportRequestId: submitted.reportRequestId,
      status: completed.status,
      pollAttempts: completed.attempts,
      rowCount: allRows.length,
      rows,
      allRows
    }
  }

  async function generateCampaignPerformanceReport({
    columns = MICROSOFT_ADS_DEFAULT_CAMPAIGN_REPORT_COLUMNS,
    aggregation = 'Summary',
    predefinedTime = 'Last30Days',
    reportTimeZone = 'BrusselsCopenhagenMadridParis',
    reportName = `utekos-microsoft-ads-campaign-${Date.now()}`,
    returnOnlyCompleteData = false,
    rowLimit = 25,
    signal
  } = {}) {
    const accountId = requireNonEmptyString(config?.accountId, 'accountId')

    const result = await generateReport(
      {
        ExcludeColumnHeaders: false,
        ExcludeReportFooter: true,
        ExcludeReportHeader: true,
        Format: 'Csv',
        FormatVersion: '2.0',
        ReportName: reportName,
        ReturnOnlyCompleteData: returnOnlyCompleteData,
        Type: 'CampaignPerformanceReportRequest',
        Aggregation: aggregation,
        Columns: columns,
        Scope: { AccountIds: [accountId] },
        Time: {
          PredefinedTime: predefinedTime,
          ReportTimeZone: reportTimeZone
        }
      },
      { signal, rowLimit }
    )

    if (!result.ok) {
      return result
    }

    return {
      ...result,
      totals: summarizeMicrosoftAdsCampaignReportRows(result.allRows),
      allRows: undefined
    }
  }

  return {
    baseUrl,
    rawRequest,
    submitReport,
    pollReport,
    waitForReport,
    downloadReportCsv,
    generateReport,
    generateCampaignPerformanceReport
  }
}

export function parseMicrosoftAdsReportCsv(csv) {
  if (typeof csv !== 'string') {
    throw new TypeError(
      'Microsoft Advertising report CSV must be a string.'
    )
  }

  const matrix = parseCsvMatrix(csv)

  if (matrix.length === 0) {
    return []
  }

  const header = matrix[0].map((value, index) =>
    index === 0 ? value.replace(/^\uFEFF/, '') : value
  )

  return matrix
    .slice(1)
    .filter(row => row.some(value => value.trim() !== ''))
    .map(row =>
      Object.fromEntries(
        header.map((key, index) => [key, row[index] ?? ''])
      )
    )
}

export function summarizeMicrosoftAdsCampaignReportRows(rows) {
  return rows.reduce(
    (totals, row) => {
      totals.impressions += numberValue(row.Impressions)
      totals.clicks += numberValue(row.Clicks)
      totals.spend += numberValue(row.Spend)
      totals.conversionsQualified += numberValue(
        row.ConversionsQualified
      )
      totals.allConversionsQualified += numberValue(
        row.AllConversionsQualified
      )
      totals.revenue += numberValue(row.Revenue)
      totals.allRevenue += numberValue(row.AllRevenue)
      return totals
    },
    {
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversionsQualified: 0,
      allConversionsQualified: 0,
      revenue: 0,
      allRevenue: 0
    }
  )
}

function parseCsvMatrix(csv) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]

    if (quoted) {
      if (char === '"' && csv[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
      continue
    }

    if (char === ',') {
      row.push(field)
      field = ''
      continue
    }

    if (char === '\n') {
      row.push(stripTrailingCarriageReturn(field))
      rows.push(row)
      row = []
      field = ''
      continue
    }

    field += char
  }

  if (quoted) {
    throw new Error(
      'Microsoft Advertising report CSV contains an unterminated quote.'
    )
  }

  if (field.length > 0 || row.length > 0) {
    row.push(stripTrailingCarriageReturn(field))
    rows.push(row)
  }

  return rows
}

function stripTrailingCarriageReturn(value) {
  return value.endsWith('\r') ? value.slice(0, -1) : value
}

function decodeReportBuffer(buffer) {
  if (
    buffer.length < 2 ||
    buffer[0] !== 0x50 ||
    buffer[1] !== 0x4b
  ) {
    return buffer.toString('utf8')
  }

  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'utekos-msads-report-')
  )
  const zipPath = path.join(tempDir, 'report.zip')
  fs.writeFileSync(zipPath, buffer)

  try {
    return execFileSync('unzip', ['-p', zipPath], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024
    })
  } finally {
    fs.rmSync(tempDir, {
      recursive: true,
      force: true
    })
  }
}

function numberValue(value) {
  const normalized = String(value ?? '')
    .trim()
    .replaceAll(',', '')
    .replaceAll('%', '')

  return Number(normalized) || 0
}

function normalizeRelativePath(pathname) {
  if (
    typeof pathname !== 'string' ||
    !pathname.trim()
  ) {
    throw new TypeError(
      'Reporting pathname must be a non-empty string.'
    )
  }

  const value = pathname.trim()

  if (
    /^[a-z][a-z0-9+.-]*:/i.test(value) ||
    value.startsWith('//') ||
    value.includes('..')
  ) {
    throw new Error(
      'Reporting requests must use a relative API pathname.'
    )
  }

  return value.startsWith('/') ? value : `/${value}`
}

function requireNonEmptyString(value, field) {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new Error(
      `Microsoft Advertising ${field} is required.`
    )
  }

  return value.trim()
}

function requireHttpsUrl(value, field) {
  const parsed = new URL(
    requireNonEmptyString(value, field)
  )

  if (parsed.protocol !== 'https:') {
    throw new Error(
      `Microsoft Advertising ${field} must use HTTPS.`
    )
  }

  return parsed.toString()
}

function normalizeRowLimit(value) {
  if (
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new TypeError(
      'Reporting rowLimit must be a non-negative integer.'
    )
  }

  return value
}

function sleep(milliseconds, signal) {
  if (
    !Number.isFinite(milliseconds) ||
    milliseconds < 0
  ) {
    throw new TypeError(
      'Sleep duration must be a non-negative number.'
    )
  }

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timeout)
      signal?.removeEventListener('abort', onAbort)
      reject(
        signal?.reason ??
          new Error('Operation aborted.')
      )
    }

    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, milliseconds)

    if (!signal) {
      return
    }

    if (signal.aborted) {
      onAbort()
      return
    }

    signal.addEventListener(
      'abort',
      onAbort,
      { once: true }
    )
  })
}