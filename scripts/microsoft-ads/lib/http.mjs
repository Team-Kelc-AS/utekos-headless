import { z } from 'zod'

const microsoftErrorSchema = z
  .object({
    Code: z.union([z.string(), z.number()]).optional(),
    ErrorCode: z.union([z.string(), z.number()]).optional(),
    Message: z.string().optional(),
    FieldPath: z.string().optional(),
    Index: z.number().optional()
  })
  .passthrough()

export class MicrosoftAdsHttpError extends Error {
  constructor(
    message,
    {
      method,
      url,
      status = null,
      statusText = null,
      trackingId = null,
      retryAfter = null,
      details = [],
      responseBody = null,
      cause
    } = {}
  ) {
    super(message, { cause })

    this.name = 'MicrosoftAdsHttpError'
    this.method = method ?? null
    this.url = url ?? null
    this.status = status
    this.statusText = statusText
    this.trackingId = trackingId
    this.retryAfter = retryAfter
    this.details = details
    this.responseBody = responseBody
  }
}

export function createMicrosoftAdsApiHeaders({
  config,
  accessToken,
  customerId = config?.customerId,
  accountId = config?.accountId,
  additionalHeaders = {}
}) {
  const developerToken = requireNonEmptyString(
    config?.developerToken,
    'developerToken'
  )
  const token = requireNonEmptyString(accessToken, 'accessToken')
  const resolvedCustomerId = requireNonEmptyString(
    customerId,
    'customerId'
  )
  const resolvedAccountId = requireNonEmptyString(accountId, 'accountId')

  return {
    ...additionalHeaders,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    DeveloperToken: developerToken,
    CustomerId: resolvedCustomerId,
    CustomerAccountId: resolvedAccountId
  }
}

export async function requestMicrosoftAdsJson(
  url,
  {
    method = 'GET',
    headers = {},
    body,
    fetchImpl = globalThis.fetch,
    timeoutMs = 30_000,
    signal
  } = {}
) {
  if (typeof fetchImpl !== 'function') {
    throw new TypeError('fetchImpl must be a function.')
  }

  const targetUrl = String(url)
  const requestHeaders = new Headers(headers)
  const requestBody = serializeRequestBody(body, requestHeaders)

  const timeoutController = new AbortController()

  const timeout =
    timeoutMs > 0
      ? setTimeout(
          () =>
            timeoutController.abort(
              new Error(`Request timed out after ${timeoutMs} ms.`)
            ),
          timeoutMs
        )
      : null

  const requestSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal

  try {
    let response

    try {
      response = await fetchImpl(targetUrl, {
        method,
        headers: requestHeaders,
        ...(requestBody !== undefined ? { body: requestBody } : {}),
        signal: requestSignal
      })
    } catch (error) {
      throw new MicrosoftAdsHttpError(
        `Microsoft Advertising request failed before receiving a response: ${safeErrorMessage(
          error
        )}`,
        {
          method,
          url: targetUrl,
          cause: error
        }
      )
    }

    const text = await response.text()
    const data = parseResponseBody(text)
    const trackingId = extractTrackingId(response, data)

    if (!response.ok) {
      const details = extractMicrosoftAdsErrorDetails(data)
      const firstMessage = details.find(detail => detail.message)?.message

      const message = [
        `Microsoft Advertising request failed with HTTP ${response.status}`,
        firstMessage ? `: ${firstMessage}` : ''
      ].join('')

      throw new MicrosoftAdsHttpError(message, {
        method,
        url: targetUrl,
        status: response.status,
        statusText: response.statusText || null,
        trackingId,
        retryAfter: response.headers.get('retry-after'),
        details,
        responseBody: redactMicrosoftAdsSecrets(data)
      })
    }

    return data
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}

export function extractMicrosoftAdsErrorDetails(value) {
  if (!value || typeof value !== 'object') {
    return []
  }

  const candidates = []
  const arrays = [
    'OperationErrors',
    'PartialErrors',
    'BatchErrors',
    'Errors'
  ]

  for (const key of arrays) {
    if (Array.isArray(value[key])) {
      candidates.push(...value[key])
    }
  }

  if (value.error && typeof value.error === 'object') {
    candidates.push(value.error)
  }

  if (typeof value.error === 'string') {
    candidates.push({
      ErrorCode: value.error,
      Message:
        typeof value.error_description === 'string'
          ? value.error_description
          : undefined
    })
  }

  if (
    candidates.length === 0 &&
    ('Message' in value || 'Code' in value || 'ErrorCode' in value)
  ) {
    candidates.push(value)
  }

  return candidates.flatMap(candidate => {
    const parsed = microsoftErrorSchema.safeParse(candidate)

    if (!parsed.success) {
      return []
    }

    return [
      {
        code: parsed.data.Code ?? null,
        errorCode: parsed.data.ErrorCode ?? null,
        message: parsed.data.Message ?? null,
        fieldPath: parsed.data.FieldPath ?? null,
        index: parsed.data.Index ?? null
      }
    ]
  })
}

export function redactMicrosoftAdsSecrets(value) {
  if (typeof value === 'string') {
    return value
      .replace(
        /Bearer\s+[A-Za-z0-9._~+\-/]+=*/gi,
        'Bearer [REDACTED]'
      )
      .replace(
        /((?:access|refresh)(?:_|)?token|client(?:_|)?secret|developer(?:_|)?token)(\s*[=:]\s*)[^\s,&}]+/gi,
        '$1$2[REDACTED]'
      )
  }

  if (Array.isArray(value)) {
    return value.map(redactMicrosoftAdsSecrets)
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      isSecretKey(key)
        ? '[REDACTED]'
        : redactMicrosoftAdsSecrets(child)
    ])
  )
}

function serializeRequestBody(body, headers) {
  if (body === undefined) {
    return undefined
  }

  if (
    typeof body === 'string' ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  ) {
    return body
  }

  if (!headers.has('content-type')) {
    headers.set('Content-Type', 'application/json')
  }

  return JSON.stringify(body)
}

function parseResponseBody(text) {
  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function extractTrackingId(response, data) {
  const headerValue =
    response.headers.get('trackingid') ||
    response.headers.get('x-ms-tracking-id')

  if (headerValue) {
    return headerValue
  }

  if (
    data &&
    typeof data === 'object' &&
    typeof data.TrackingId === 'string'
  ) {
    return data.TrackingId
  }

  return null
}

function safeErrorMessage(error) {
  const message =
    error instanceof Error ? error.message : String(error)

  return redactMicrosoftAdsSecrets(message)
}

function requireNonEmptyString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(
      `Microsoft Advertising ${field} is required.`
    )
  }

  return value.trim()
}

function isSecretKey(key) {
  return /^(authorization|authenticationtoken|developertoken|developer_token|clientsecret|client_secret|accesstoken|access_token|refreshtoken|refresh_token|uetcapitoken)$/i.test(
    key
  )
}