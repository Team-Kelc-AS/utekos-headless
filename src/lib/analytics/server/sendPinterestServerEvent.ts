import type { PinterestConversionEvent } from './mapCanonicalEventToPinterest'
import { getPinterestConversionsApiConfig } from './pinterestConversionsApiConfig'

export type PinterestConversionsApiResponse = {
  events?: Array<{
    error_message?: string | null
    status?: string
    warning_message?: string | null
  }>
  num_events_processed?: number
  num_events_received?: number
}

export type PinterestSendResult =
  | { status: 'disabled' }
  | { status: 'sent'; response: PinterestConversionsApiResponse }

export class PinterestConversionsApiConfigError extends Error {
  readonly reason: 'disabled' | 'missing_capi_token'

  constructor(reason: 'disabled' | 'missing_capi_token') {
    super(`Pinterest Conversions API ${reason}`)
    this.name = 'PinterestConversionsApiConfigError'
    this.reason = reason
  }
}

export class PinterestConversionsApiSkipError extends Error {
  readonly reason:
    | 'marketing_consent_not_granted'
    | 'non_production_event'
    | 'unsupported_event'
    | 'insufficient_user_identity'

  constructor(
    reason:
      | 'marketing_consent_not_granted'
      | 'non_production_event'
      | 'unsupported_event'
      | 'insufficient_user_identity'
  ) {
    super(`Pinterest Conversions API skipped: ${reason}`)
    this.name = 'PinterestConversionsApiSkipError'
    this.reason = reason
  }
}

export class PinterestConversionsApiHttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'PinterestConversionsApiHttpError'
    this.status = status
  }
}

export async function sendPinterestServerEvent(
  event: PinterestConversionEvent
): Promise<PinterestSendResult> {
  const config = getPinterestConversionsApiConfig()

  if (!config.enabled) {
    return { status: 'disabled' }
  }

  const endpoint =
    'https://api.pinterest.com/v5/ad_accounts/' +
    encodeURIComponent(config.adAccountId) +
    '/events'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + config.accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data: [event] }),
    cache: 'no-store'
  })

  const text = await response.text()
  let payload: PinterestConversionsApiResponse = {}

  if (text) {
    try {
      payload = JSON.parse(
        text
      ) as PinterestConversionsApiResponse
    } catch {
      throw new PinterestConversionsApiHttpError(
        response.status,
        `Pinterest Conversions API returned non-JSON HTTP ${response.status}`
      )
    }
  }

  if (!response.ok) {
    const firstError = payload.events?.find(
      item => item.error_message
    )?.error_message
    throw new PinterestConversionsApiHttpError(
      response.status,
      firstError ?
        `Pinterest Conversions API HTTP ${response.status}: ${firstError}`
      : `Pinterest Conversions API HTTP ${response.status}`
    )
  }

  const failedEvent = payload.events?.find(
    item => item.status === 'failed' || item.error_message
  )
  if (failedEvent) {
    throw new PinterestConversionsApiHttpError(
      response.status,
      failedEvent.error_message ??
        'Pinterest Conversions API rejected the event'
    )
  }

  return { status: 'sent', response: payload }
}
