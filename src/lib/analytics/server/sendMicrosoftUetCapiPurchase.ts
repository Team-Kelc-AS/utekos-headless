import {
  getMicrosoftUetCapiConfig,
  type MicrosoftUetCapiConfig
} from './getMicrosoftUetCapiConfig'
import {
  buildMicrosoftUetCapiPurchaseRequest,
  type MicrosoftUetCapiPurchaseEvent,
  type MicrosoftUetCapiRequest
} from './mapCanonicalPurchaseToMicrosoftUet'
import { resolveMicrosoftUetCapiTokenFromEnv } from './microsoftUetCapiTokenEnvKeys'
import type { CanonicalPurchase } from '../purchaseEvent'
import { hasMicrosoftUetCapiIdentifier } from './hasMicrosoftUetCapiIdentifier'
import {
  formatMicrosoftUetCapiHttpErrorMessage,
  parseMicrosoftUetCapiResponse,
  type MicrosoftUetCapiResponseSummary
} from './parseMicrosoftUetCapiResponse'

export type MicrosoftUetCapiSendResult = MicrosoftUetCapiResponseSummary & {
  eventId: string
  eventName: 'purchase'
  requestId: string | null
  status: number
  tagId: string
}

export class MicrosoftUetCapiHttpError extends Error {
  readonly details: unknown
  readonly requestId: string | null
  readonly status: number

  constructor(
    status: number,
    message: string,
    options?: {
      details?: unknown
      requestId?: string | null
    }
  ) {
    super(message)
    this.name = 'MicrosoftUetCapiHttpError'
    this.status = status
    this.details = options?.details
    this.requestId = options?.requestId ?? null
  }
}

export class MicrosoftUetCapiConfigError extends Error {
  readonly reason:
    | 'missing_capi_token'
    | 'missing_microsoft_uet_identifier'

  constructor(
    reason:
      | 'missing_capi_token'
      | 'missing_microsoft_uet_identifier'
  ) {
    super(`Microsoft UET CAPI skipped: ${reason}`)
    this.name = 'MicrosoftUetCapiConfigError'
    this.reason = reason
  }
}

type MicrosoftUetFetch = (
  input: string,
  init: RequestInit
) => Promise<Pick<Response, 'headers' | 'ok' | 'status' | 'text'>>

export type MicrosoftUetCapiSendDependencies = {
  fetchFn: MicrosoftUetFetch
  readConfig: () => MicrosoftUetCapiConfig
  resolveToken: () => string | undefined
}

const defaultDependencies: MicrosoftUetCapiSendDependencies = {
  fetchFn: fetch,
  readConfig: getMicrosoftUetCapiConfig,
  resolveToken: resolveMicrosoftUetCapiTokenFromEnv
}

function readRequestId(headers: Headers): string | null {
  return (
    headers.get('x-ms-request-id')
    ?? headers.get('request-id')
    ?? null
  )
}

export async function sendMicrosoftUetCapiPurchase(
  event: CanonicalPurchase,
  dependencies: MicrosoftUetCapiSendDependencies = defaultDependencies
): Promise<MicrosoftUetCapiSendResult> {
  const config = dependencies.readConfig()
  const apiToken = config.apiToken ?? dependencies.resolveToken()

  if (!apiToken) {
    throw new MicrosoftUetCapiConfigError('missing_capi_token')
  }

  if (!hasMicrosoftUetCapiIdentifier(event)) {
    throw new MicrosoftUetCapiConfigError(
      'missing_microsoft_uet_identifier'
    )
  }

  const requestBody: MicrosoftUetCapiRequest =
    buildMicrosoftUetCapiPurchaseRequest(event)
  const purchaseEvent: MicrosoftUetCapiPurchaseEvent =
    requestBody.data[0]!

  const response = await dependencies.fetchFn(
    `https://capi.uet.microsoft.com/v1/${config.tagId}/events`,
    {
      body: JSON.stringify(requestBody),
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      method: 'POST'
    }
  )
  const responseText = await response.text()
  const requestId = readRequestId(response.headers)
  const responseSummary =
    parseMicrosoftUetCapiResponse(responseText)

  if (!response.ok) {
    throw new MicrosoftUetCapiHttpError(
      response.status,
      formatMicrosoftUetCapiHttpErrorMessage(
        response.status,
        responseSummary
      ),
      {
        details: responseSummary,
        requestId
      }
    )
  }

  return {
    ...responseSummary,
    eventId: purchaseEvent.eventId,
    eventName: purchaseEvent.eventName,
    requestId,
    status: response.status,
    tagId: config.tagId
  }
}
