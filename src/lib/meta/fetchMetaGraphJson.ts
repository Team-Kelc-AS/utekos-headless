import 'server-only'

import { createHmac } from 'node:crypto'

const META_GRAPH_TIMEOUT_MS = 10_000

type MetaGraphFetchResponse = Pick<
  Response,
  'json' | 'ok' | 'status'
>

export type MetaGraphFetch = (
  input: string,
  init: RequestInit
) => Promise<MetaGraphFetchResponse>

type MetaGraphSchema<Output> = {
  parse: (input: unknown) => Output
}

type FetchMetaGraphJsonInput<Output> = {
  accessToken: string
  appSecret?: string
  fetchImplementation?: MetaGraphFetch
  schema: MetaGraphSchema<Output>
  timeoutMs?: number
  url: URL
}

type MetaGraphErrorDetails = {
  code?: number
  errorSubcode?: number
  isTransient?: boolean
}

function readMetaErrorDetails(
  input: unknown
): MetaGraphErrorDetails {
  if (
    !input ||
    typeof input !== 'object' ||
    !('error' in input)
  ) {
    return {}
  }

  const error = input.error
  if (!error || typeof error !== 'object') return {}

  return {
    ...('code' in error && typeof error.code === 'number' ?
      { code: error.code }
    : {}),
    ...((
      'error_subcode' in error &&
      typeof error.error_subcode === 'number'
    ) ?
      { errorSubcode: error.error_subcode }
    : {}),
    ...((
      'is_transient' in error &&
      typeof error.is_transient === 'boolean'
    ) ?
      { isTransient: error.is_transient }
    : {})
  }
}

export class MetaGraphHttpError extends Error {
  readonly code: number | undefined
  readonly errorSubcode: number | undefined
  readonly isTransient: boolean | undefined
  readonly status: number

  constructor(status: number, details: MetaGraphErrorDetails) {
    const suffix =
      details.code === undefined ? '' : ` (code ${details.code})`
    super(
      `Meta Graph request failed with HTTP ${status}${suffix}`
    )
    this.name = 'MetaGraphHttpError'
    this.status = status
    this.code = details.code
    this.errorSubcode = details.errorSubcode
    this.isTransient = details.isTransient
  }
}

export function createMetaAppSecretProof(
  accessToken: string,
  appSecret: string
) {
  return createHmac('sha256', appSecret)
    .update(accessToken, 'utf8')
    .digest('hex')
}

export async function fetchMetaGraphJson<Output>(
  input: FetchMetaGraphJsonInput<Output>
): Promise<Output> {
  const timeoutMs = input.timeoutMs ?? META_GRAPH_TIMEOUT_MS
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error(
      'Meta Graph timeout must be a positive integer'
    )
  }

  const requestUrl = new URL(input.url)
  const serializedUrl = requestUrl.toString()
  if (
    requestUrl.searchParams.has('access_token') ||
    serializedUrl.includes(input.accessToken) ||
    (input.appSecret && serializedUrl.includes(input.appSecret))
  ) {
    throw new Error(
      'Meta credentials must not appear in request URLs'
    )
  }

  if (input.appSecret) {
    requestUrl.searchParams.set(
      'appsecret_proof',
      createMetaAppSecretProof(
        input.accessToken,
        input.appSecret
      )
    )
  }

  const fetchImplementation =
    input.fetchImplementation ??
    ((url: string, init: RequestInit) => fetch(url, init))
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImplementation(
      requestUrl.toString(),
      {
        cache: 'no-store',
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${input.accessToken}`
        },
        method: 'GET',
        signal: controller.signal
      }
    )
    const body: unknown = await response.json()

    if (!response.ok) {
      throw new MetaGraphHttpError(
        response.status,
        readMetaErrorDetails(body)
      )
    }

    return input.schema.parse(body)
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        `Meta Graph request exceeded ${timeoutMs}ms`
      )
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}
