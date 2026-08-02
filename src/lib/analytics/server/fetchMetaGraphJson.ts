const META_GRAPH_TIMEOUT_MS = 10_000

type MetaGraphFetchResponse = Pick<Response, 'json' | 'ok' | 'status'>

export type MetaGraphFetch = (
  input: string,
  init: RequestInit
) => Promise<MetaGraphFetchResponse>

type MetaGraphSchema<Output> = {
  parse: (input: unknown) => Output
}

type FetchMetaGraphJsonInput<Output> = {
  accessToken: string
  fetchImplementation?: MetaGraphFetch
  schema: MetaGraphSchema<Output>
  timeoutMs?: number
  url: URL
}

function readMetaErrorCode(input: unknown) {
  if (!input || typeof input !== 'object' || !('error' in input)) {
    return undefined
  }

  const error = input.error
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return undefined
  }

  return typeof error.code === 'number' ? error.code : undefined
}

export async function fetchMetaGraphJson<Output>(
  input: FetchMetaGraphJsonInput<Output>
): Promise<Output> {
  const timeoutMs = input.timeoutMs ?? META_GRAPH_TIMEOUT_MS
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error('Meta Graph timeout must be a positive integer')
  }

  if (
    input.url.searchParams.has('access_token') ||
    input.url.toString().includes(input.accessToken)
  ) {
    throw new Error('Meta access tokens must not appear in request URLs')
  }

  const fetchImplementation =
    input.fetchImplementation ??
    ((requestUrl: string, init: RequestInit) =>
      fetch(requestUrl, init))
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImplementation(input.url.toString(), {
      cache: 'no-store',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${input.accessToken}`
      },
      method: 'GET',
      signal: controller.signal
    })
    const body: unknown = await response.json()

    if (!response.ok) {
      const code = readMetaErrorCode(body)
      const suffix = code === undefined ? '' : ` (code ${code})`
      throw new Error(
        `Meta Graph request failed with HTTP ${response.status}${suffix}`
      )
    }

    return input.schema.parse(body)
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`Meta Graph request exceeded ${timeoutMs}ms`)
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}
