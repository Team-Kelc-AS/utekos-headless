import type { CanonicalPageView } from '../pageViewEvent'
import {
  getMicrosoftUetCapiConfig,
  type MicrosoftUetCapiConfig
} from './getMicrosoftUetCapiConfig'
import { hasMicrosoftUetCapiIdentifier } from './hasMicrosoftUetCapiIdentifier'
import {
  buildMicrosoftUetCapiPageViewRequest,
  type MicrosoftUetCapiPageViewEvent,
  type MicrosoftUetCapiPageViewRequest
} from './mapCanonicalPageViewToMicrosoftUet'
import { resolveMicrosoftUetCapiTokenFromEnv } from './microsoftUetCapiTokenEnvKeys'
import {
  formatMicrosoftUetCapiHttpErrorMessage,
  parseMicrosoftUetCapiResponse,
  type MicrosoftUetCapiResponseSummary
} from './parseMicrosoftUetCapiResponse'
import {
  MicrosoftUetCapiConfigError,
  MicrosoftUetCapiHttpError
} from './sendMicrosoftUetCapiPurchase'

export type MicrosoftUetCapiPageViewSendResult =
  MicrosoftUetCapiResponseSummary & {
    eventId: string
    eventName: 'page_view'
    requestId: string | null
    status: number
    tagId: string
  }

type MicrosoftUetFetch = (
  input: string,
  init: RequestInit
) => Promise<Pick<Response, 'headers' | 'ok' | 'status' | 'text'>>

export type MicrosoftUetCapiPageViewSendDependencies = {
  fetchFn: MicrosoftUetFetch
  readConfig: () => MicrosoftUetCapiConfig
  resolveToken: () => string | undefined
}

const defaultDependencies: MicrosoftUetCapiPageViewSendDependencies = {
  fetchFn: fetch,
  readConfig: getMicrosoftUetCapiConfig,
  resolveToken: resolveMicrosoftUetCapiTokenFromEnv
}

function readRequestId(headers: Headers): string | null {
  return (
    headers.get('x-ms-request-id') ??
    headers.get('request-id') ??
    null
  )
}

export async function sendMicrosoftUetCapiPageView(
  event: CanonicalPageView,
  dependencies: MicrosoftUetCapiPageViewSendDependencies =
    defaultDependencies
): Promise<MicrosoftUetCapiPageViewSendResult> {
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

  const requestBody: MicrosoftUetCapiPageViewRequest =
    buildMicrosoftUetCapiPageViewRequest(event)
  const pageViewEvent: MicrosoftUetCapiPageViewEvent =
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
  const responseSummary = parseMicrosoftUetCapiResponse(responseText)

  if (!response.ok) {
    throw new MicrosoftUetCapiHttpError(
      response.status,
      formatMicrosoftUetCapiHttpErrorMessage(
        response.status,
        responseSummary
      ),
      { details: responseSummary, requestId }
    )
  }

  return {
    ...responseSummary,
    eventId: pageViewEvent.eventId,
    eventName: pageViewEvent.eventName,
    requestId,
    status: response.status,
    tagId: config.tagId
  }
}
