import type { SnapchatConversionEvent } from './mapCanonicalEventToSnapchat'
import { getSnapchatConversionsApiConfig } from './snapchatConversionsApiConfig'

type UnknownRecord = Record<string, unknown>

export type SnapchatConversionsApiResponse = {
  requestId?: string
  requestStatus?: string
  status?: string
}

export type SnapchatSendResult =
  | { status: 'disabled' }
  | {
      status: 'sent'
      acceptance: 'accepted_unverified'
      response: SnapchatConversionsApiResponse
    }

export class SnapchatConversionsApiConfigError extends Error {
  readonly reason: 'disabled' | 'missing_snapchat_configuration'

  constructor(
    reason: 'disabled' | 'missing_snapchat_configuration',
    message?: string
  ) {
    super(message ?? `Snapchat Conversions API ${reason}`)
    this.name = 'SnapchatConversionsApiConfigError'
    this.reason = reason
  }
}

export class SnapchatConversionsApiSkipError extends Error {
  readonly reason:
    | 'marketing_consent_not_granted'
    | 'non_production_event'
    | 'unsupported_event'
    | 'missing_snapchat_match_identifier'
    | 'snapchat_event_outside_7d'
    | 'snapchat_before_cutover'

  constructor(
    reason: SnapchatConversionsApiSkipError['reason']
  ) {
    super(`Snapchat Conversions API skipped: ${reason}`)
    this.name = 'SnapchatConversionsApiSkipError'
    this.reason = reason
  }
}

export class SnapchatConversionsApiHttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'SnapchatConversionsApiHttpError'
    this.status = status
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(
    value && typeof value === 'object' && !Array.isArray(value)
  )
}

function readString(input: UnknownRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = input[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim().slice(0, 400)
    }
  }
  return undefined
}

function readRequestId(input: UnknownRecord) {
  const value = readString(input, 'request_id', 'requestId')
  return value && /^[A-Za-z0-9._:-]{1,200}$/.test(value) ?
      value
    : undefined
}

function readStatus(input: UnknownRecord, ...keys: string[]) {
  const value = readString(input, ...keys)?.toUpperCase()
  return value && /^[A-Z_]{1,64}$/.test(value) ?
      value
    : undefined
}

function sanitizeResponse(
  payload: unknown
): SnapchatConversionsApiResponse {
  if (!isRecord(payload)) return {}

  const requestId = readRequestId(payload)
  const requestStatus = readStatus(
    payload,
    'request_status',
    'requestStatus'
  )
  const status = readStatus(payload, 'status')
  return {
    ...(requestId ? { requestId } : {}),
    ...(requestStatus ? { requestStatus } : {}),
    ...(status ? { status } : {})
  }
}

function describeFailure(
  status: number,
  response: SnapchatConversionsApiResponse
) {
  const detail = response.requestStatus ?? response.status

  return detail ?
      `Snapchat Conversions API HTTP ${status}: ${detail}`
    : `Snapchat Conversions API HTTP ${status}`
}

export async function sendSnapchatServerEvent(
  event: SnapchatConversionEvent
): Promise<SnapchatSendResult> {
  let config
  try {
    config = getSnapchatConversionsApiConfig()
  } catch (error) {
    throw new SnapchatConversionsApiConfigError(
      'missing_snapchat_configuration',
      error instanceof Error ? error.message : undefined
    )
  }

  if (!config.enabled) return { status: 'disabled' }

  const endpoint = new URL(
    `https://tr.snapchat.com/v3/${encodeURIComponent(config.pixelId)}/events`
  )
  endpoint.searchParams.set('access_token', config.accessToken)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [event] }),
    cache: 'no-store'
  })

  const text = await response.text()
  let payload: unknown = {}

  if (text) {
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      throw new SnapchatConversionsApiHttpError(
        response.status,
        `Snapchat Conversions API returned non-JSON HTTP ${response.status}`
      )
    }
  }

  const sanitized = sanitizeResponse(payload)
  if (!response.ok) {
    throw new SnapchatConversionsApiHttpError(
      response.status,
      describeFailure(response.status, sanitized)
    )
  }

  const providerStatus = (
    sanitized.requestStatus ??
    sanitized.status ??
    ''
  ).toUpperCase()
  if (providerStatus !== 'SUCCESS') {
    throw new SnapchatConversionsApiHttpError(
      response.status,
      describeFailure(response.status, sanitized)
    )
  }

  return {
    status: 'sent',
    acceptance: 'accepted_unverified',
    response: sanitized
  }
}
