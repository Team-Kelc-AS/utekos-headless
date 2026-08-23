import {
  EventRequest,
  type HttpServiceInterface,
  type ServerEvent
} from 'facebook-nodejs-business-sdk'
import { z } from 'zod'

const META_PARTNER_AGENT = 'utekos-headless'
const META_REQUEST_TIMEOUT_MS = 10_000

type Environment = Readonly<Record<string, string | undefined>>

export type MetaConversionsApiConfig = {
  accessToken: string
  appSecret?: string
  pixelId: string
  testEventCode?: string
}

type MetaEventResponse = {
  events_received: number
  fbtrace_id?: string
  http_status?: number
  id?: string
  messages?: string[]
  num_processed_entries?: number
}

type MetaFetchResponse = Pick<
  Response,
  'json' | 'ok' | 'status'
>

type MetaFetch = (
  input: string,
  init: RequestInit
) => Promise<MetaFetchResponse>

const metaEventResponseSchema = z
  .object({
    events_received: z.number().int().nonnegative(),
    fbtrace_id: z.string().optional(),
    id: z.string().optional(),
    messages: z.array(z.string()).optional(),
    num_processed_entries: z
      .number()
      .int()
      .nonnegative()
      .optional()
  })
  .passthrough()

const metaErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: z.number().optional(),
        error_subcode: z.number().optional(),
        is_transient: z.boolean().optional()
      })
      .passthrough()
  })
  .passthrough()

class MetaConversionsApiHttpError extends Error {
  readonly response: Record<string, unknown> | undefined
  readonly status: number

  constructor(
    status: number,
    response?: Record<string, unknown>
  ) {
    super(
      `Meta Conversions API request failed with HTTP ${status}`
    )
    this.name = 'MetaConversionsApiHttpError'
    this.status = status
    this.response = response
  }
}

class MetaConversionsApiTimeoutError extends Error {
  readonly code = 'ETIMEDOUT'

  constructor(timeoutMs: number) {
    super(
      `Meta Conversions API request exceeded ${timeoutMs}ms`
    )
    this.name = 'MetaConversionsApiTimeoutError'
  }
}

export type MetaEventRequest = {
  execute: () => Promise<MetaEventResponse>
  setAppSecret: (appSecret: string) => MetaEventRequest
  setEvents: (events: ServerEvent[]) => MetaEventRequest
  setHttpService: (
    httpService: HttpServiceInterface
  ) => MetaEventRequest
  setPartnerAgent: (partnerAgent: string) => MetaEventRequest
  setTestEventCode: (testEventCode: string) => MetaEventRequest
}

export type MetaEventRequestFactory = (
  accessToken: string,
  pixelId: string
) => MetaEventRequest

type MetaSenderDependencies = {
  createRequest: MetaEventRequestFactory
}

export type MetaSendResult = {
  datasetId?: string
  eventsReceived: number
  fbTraceId?: string
  httpStatus?: number
  messages: string[]
  processedEntries?: number
}

const defaultDependencies: MetaSenderDependencies = {
  createRequest: (accessToken, pixelId) =>
    new EventRequest(accessToken, pixelId).setHttpService(
      createMetaHttpService()
    )
}

export function createMetaHttpService(
  fetchImplementation: MetaFetch = (input, init) =>
    fetch(input, init),
  timeoutMs = META_REQUEST_TIMEOUT_MS
): HttpServiceInterface {
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error(
      'Meta request timeout must be a positive integer'
    )
  }

  return {
    async executeRequest(url, method, headers, params) {
      const controller = new AbortController()
      const timeout = setTimeout(
        () => controller.abort(),
        timeoutMs
      )

      try {
        const response = await fetchImplementation(url, {
          body: JSON.stringify(params),
          headers,
          method,
          signal: controller.signal
        })

        let responseBody: unknown

        try {
          responseBody = await response.json()
        } catch (error) {
          if (!response.ok) {
            throw new MetaConversionsApiHttpError(
              response.status
            )
          }

          throw error
        }

        if (!response.ok) {
          const parsedError =
            metaErrorResponseSchema.safeParse(responseBody)

          throw new MetaConversionsApiHttpError(
            response.status,
            parsedError.success ?
              parsedError.data.error
            : undefined
          )
        }

        return {
          ...metaEventResponseSchema.parse(responseBody),
          http_status: response.status
        }
      } catch (error) {
        if (controller.signal.aborted) {
          throw new MetaConversionsApiTimeoutError(timeoutMs)
        }

        throw error
      } finally {
        clearTimeout(timeout)
      }
    }
  } as HttpServiceInterface
}

function requiredEnvironmentValue(
  environment: Environment,
  name: string
) {
  const value = environment[name]?.trim()

  if (!value) {
    throw new Error(
      `Missing required Meta configuration: ${name}`
    )
  }

  return value
}

function optionalEnvironmentValue(
  environment: Environment,
  name: string
) {
  return environment[name]?.trim() || undefined
}

export function readMetaConversionsApiConfig(
  environment: Environment = process.env
): MetaConversionsApiConfig {
  const accessToken = requiredEnvironmentValue(
    environment,
    'META_ACCESS_TOKEN'
  )
  const pixelId = requiredEnvironmentValue(
    environment,
    'META_PIXEL_ID'
  )
  const appSecret = optionalEnvironmentValue(
    environment,
    'META_APP_SECRET'
  )
  const testEventCode = optionalEnvironmentValue(
    environment,
    'META_TEST_EVENT_CODE'
  )

  return {
    accessToken,
    pixelId,
    ...(appSecret ? { appSecret } : {}),
    ...(testEventCode ? { testEventCode } : {})
  }
}

export async function sendMetaServerEvent(
  event: ServerEvent,
  config: MetaConversionsApiConfig,
  dependencies: MetaSenderDependencies = defaultDependencies
): Promise<MetaSendResult> {
  const request = dependencies
    .createRequest(config.accessToken, config.pixelId)
    .setEvents([event])
    .setPartnerAgent(META_PARTNER_AGENT)

  if (config.appSecret) {
    request.setAppSecret(config.appSecret)
  }
  if (config.testEventCode) {
    request.setTestEventCode(config.testEventCode)
  }

  const response = await request.execute()

  if (response.events_received !== 1) {
    throw new Error(
      `Meta Conversions API received ${response.events_received} events; expected 1`
    )
  }

  return {
    eventsReceived: response.events_received,
    messages: response.messages ?? [],
    ...(response.id ? { datasetId: response.id } : {}),
    ...(response.fbtrace_id ?
      { fbTraceId: response.fbtrace_id }
    : {}),
    ...(response.http_status === undefined ?
      {}
    : { httpStatus: response.http_status }),
    ...(response.num_processed_entries === undefined ?
      {}
    : { processedEntries: response.num_processed_entries })
  }
}
