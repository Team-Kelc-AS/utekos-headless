import type { CanonicalBeginCheckout } from '../beginCheckoutEvent'
import {
  getMicrosoftUetCapiConfig,
  type MicrosoftUetCapiConfig
} from './getMicrosoftUetCapiConfig'
import {
  buildMicrosoftUetCapiBeginCheckoutRequest,
  type MicrosoftUetCapiBeginCheckoutEvent,
  type MicrosoftUetCapiBeginCheckoutRequest
} from './mapCanonicalBeginCheckoutToMicrosoftUet'
import { resolveMicrosoftUetCapiTokenFromEnv } from './microsoftUetCapiTokenEnvKeys'
import {
  MicrosoftUetCapiConfigError,
  MicrosoftUetCapiHttpError
} from './sendMicrosoftUetCapiPurchase'
import { hasMicrosoftUetCapiIdentifier } from './hasMicrosoftUetCapiIdentifier'
import {
  formatMicrosoftUetCapiHttpErrorMessage,
  parseMicrosoftUetCapiResponse,
  type MicrosoftUetCapiResponseSummary
} from './parseMicrosoftUetCapiResponse'

export type MicrosoftUetCapiBeginCheckoutSendResult = MicrosoftUetCapiResponseSummary & {
  eventId: string
  eventName: 'begin_checkout'
  requestId: string | null
  status: number
  tagId: string
}

type MicrosoftUetFetch = (
  input: string,
  init: RequestInit
) => Promise<Pick<Response, 'headers' | 'ok' | 'status' | 'text'>>

export type MicrosoftUetCapiBeginCheckoutSendDependencies = {
  fetchFn: MicrosoftUetFetch
  readConfig: () => MicrosoftUetCapiConfig
  resolveToken: () => string | undefined
}

const defaultDependencies: MicrosoftUetCapiBeginCheckoutSendDependencies =
  {
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

export async function sendMicrosoftUetCapiBeginCheckout(
  event: CanonicalBeginCheckout,
  dependencies: MicrosoftUetCapiBeginCheckoutSendDependencies = defaultDependencies
): Promise<MicrosoftUetCapiBeginCheckoutSendResult> {
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

  const requestBody: MicrosoftUetCapiBeginCheckoutRequest =
    buildMicrosoftUetCapiBeginCheckoutRequest(event)
  const beginCheckoutEvent: MicrosoftUetCapiBeginCheckoutEvent =
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
    eventId: beginCheckoutEvent.eventId,
    eventName: beginCheckoutEvent.eventName,
    requestId,
    status: response.status,
    tagId: config.tagId
  }
}
