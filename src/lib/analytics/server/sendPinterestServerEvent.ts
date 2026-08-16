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
      throw new Error(
        `Pinterest Conversions API returned non-JSON HTTP ${response.status}`
      )
    }
  }

  if (!response.ok) {
    const firstError = payload.events?.find(
      item => item.error_message
    )?.error_message
    throw new Error(
      firstError ?
        `Pinterest Conversions API HTTP ${response.status}: ${firstError}`
      : `Pinterest Conversions API HTTP ${response.status}`
    )
  }

  const failedEvent = payload.events?.find(
    item => item.status === 'failed' || item.error_message
  )
  if (failedEvent) {
    throw new Error(
      failedEvent.error_message ??
        'Pinterest Conversions API rejected the event'
    )
  }

  return { status: 'sent', response: payload }
}
