import {
  createUIMessageStream,
  createUIMessageStreamResponse
} from 'ai'
import {
  assistantRecommendationSchema,
  parseAssistantChatRequest,
  type AssistantUIMessage
} from '../assistantProtocol'
import {
  resolveAssistantPreviewRolloutPercent,
  type AssistantRolloutEnvironment
} from '../assistantRollout'
import {
  answerAssistantRequest,
  type AssistantOutcome
} from './answerAssistantRequest'

const MAX_BODY_BYTES = 24 * 1024
const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_TRACKED_SESSIONS = 10_000
const PREVIEW_REQUESTS_PER_MINUTE = 12
const SAFE_STREAM_ERROR =
  'Jeg fikk ikke hentet et sikkert svar. Du kan kontakte kundeservice.'
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0'
}

type RateLimitInput = { sessionId: string; request: Request }

export type AssistantRouteDependencies = {
  answer: typeof answerAssistantRequest
  checkRateLimit: (
    input: RateLimitInput
  ) => Promise<{ allowed: boolean }>
  now: () => number
}

type AssistantRouteRequestContext = { buyerIp?: string }

type ProcessLocalRateLimiterOptions = {
  limit: number
  now: () => number
}

type RateLimitWindow = { count: number; startedAt: number }

function errorResponse(
  error: string,
  status: number,
  headers: Record<string, string> = {}
) {
  return Response.json(
    { error },
    { headers: { ...NO_STORE_HEADERS, ...headers }, status }
  )
}

function hasJsonMediaType(request: Request) {
  const value = request.headers.get('content-type')
  if (value === null) return false

  let index = skipOptionalWhitespace(value, 0)
  const typeStart = index
  index = readToken(value, index)
  const type = value.slice(typeStart, index)

  if (value[index] !== '/') return false
  index += 1

  const subtypeStart = index
  index = readToken(value, index)
  const subtype = value.slice(subtypeStart, index)

  if (
    type.toLowerCase() !== 'application' ||
    subtype.toLowerCase() !== 'json'
  ) {
    return false
  }

  while (true) {
    index = skipOptionalWhitespace(value, index)
    if (index === value.length) return true
    if (value[index] !== ';') return false
    index = skipOptionalWhitespace(value, index + 1)

    const parameterNameStart = index
    index = readToken(value, index)
    if (index === parameterNameStart || value[index] !== '=') {
      return false
    }
    index += 1

    if (value[index] === '"') {
      const quotedStringEnd = readQuotedString(value, index)
      if (quotedStringEnd === null) return false
      index = quotedStringEnd
    } else {
      const parameterValueStart = index
      index = readToken(value, index)
      if (index === parameterValueStart) return false
    }
  }
}

function isTokenCharacter(character: string | undefined) {
  return (
    character !== undefined &&
    /^[!#$%&'*+\-.^_`|~0-9A-Za-z]$/u.test(character)
  )
}

function readToken(value: string, start: number) {
  let index = start
  while (isTokenCharacter(value[index])) index += 1
  return index
}

function skipOptionalWhitespace(value: string, start: number) {
  let index = start
  while (value[index] === ' ' || value[index] === '\t')
    index += 1
  return index
}

function isQuotedTextCharacter(codePoint: number) {
  return (
    codePoint === 9 ||
    codePoint === 32 ||
    codePoint === 33 ||
    (codePoint >= 35 && codePoint <= 91) ||
    (codePoint >= 93 && codePoint <= 126) ||
    (codePoint >= 128 && codePoint <= 255)
  )
}

function isQuotedPairCharacter(codePoint: number) {
  return (
    codePoint === 9 ||
    codePoint === 32 ||
    (codePoint >= 33 && codePoint <= 126) ||
    (codePoint >= 128 && codePoint <= 255)
  )
}

function readQuotedString(value: string, start: number) {
  let index = start + 1

  while (index < value.length) {
    const character = value[index]
    if (character === '"') return index + 1

    if (character === '\\') {
      index += 1
      if (
        index >= value.length ||
        !isQuotedPairCharacter(value.charCodeAt(index))
      ) {
        return null
      }
    } else if (!isQuotedTextCharacter(value.charCodeAt(index))) {
      return null
    }

    index += 1
  }

  return null
}

function hasSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return false

  try {
    const parsedOrigin = new URL(origin)

    return (
      parsedOrigin.username === '' &&
      parsedOrigin.password === '' &&
      parsedOrigin.pathname === '/' &&
      parsedOrigin.search === '' &&
      parsedOrigin.hash === '' &&
      // This relies on Vercel/Next carrying the trusted public origin in the
      // Request URL. Self-hosting requires a trusted canonical/preview allowlist.
      parsedOrigin.origin === new URL(request.url).origin
    )
  } catch {
    return false
  }
}

function parseDeclaredBodyLength(request: Request) {
  const value = request.headers.get('content-length')
  if (value === null) return { status: 'absent' as const }

  const normalizedValue = value.trim()
  if (!/^\d+$/u.test(normalizedValue)) {
    return { status: 'invalid' as const }
  }

  const byteLength = Number(normalizedValue)
  if (!Number.isSafeInteger(byteLength)) {
    return { status: 'invalid' as const }
  }

  return { status: 'valid' as const, byteLength }
}

async function readBoundedBody(request: Request) {
  if (!request.body) {
    return { exceeded: false as const, text: '' }
  }

  const chunks: Uint8Array[] = []
  const reader = request.body.getReader()
  let byteLength = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      byteLength += value.byteLength
      if (byteLength > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => undefined)
        return { exceeded: true as const }
      }

      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const body = new Uint8Array(byteLength)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }

  return {
    exceeded: false as const,
    text: new TextDecoder('utf-8', { fatal: true }).decode(body)
  }
}

function measureLatency(now: () => number, startedAt: number) {
  const latency = now() - startedAt
  return Number.isFinite(latency) ? Math.max(0, latency) : 0
}

function logAssistantOutcome({
  intent,
  latencyMs,
  outcomeCode,
  sessionId
}: {
  intent: string
  latencyMs: number
  outcomeCode: AssistantOutcome['failureCode'] | 'stream_error'
  sessionId: string
}) {
  console.info(
    JSON.stringify({ sessionId, intent, outcomeCode, latencyMs })
  )
}

export function createProcessLocalAssistantRateLimiter({
  limit,
  now
}: ProcessLocalRateLimiterOptions): AssistantRouteDependencies['checkRateLimit'] {
  const normalizedLimit =
    Number.isSafeInteger(limit) && limit > 0 ? limit : 0
  const windows = new Map<string, RateLimitWindow>()

  return async ({ sessionId }) => {
    if (normalizedLimit === 0) return { allowed: false }

    const timestamp = now()
    if (!Number.isFinite(timestamp)) return { allowed: false }

    for (const [trackedSessionId, window] of windows) {
      if (timestamp - window.startedAt >= RATE_LIMIT_WINDOW_MS) {
        windows.delete(trackedSessionId)
      }
    }

    const currentWindow = windows.get(sessionId)
    if (!currentWindow) {
      if (windows.size >= MAX_TRACKED_SESSIONS) {
        return { allowed: false }
      }

      windows.set(sessionId, { count: 1, startedAt: timestamp })
      return { allowed: true }
    }

    if (currentWindow.count >= normalizedLimit) {
      return { allowed: false }
    }

    currentWindow.count += 1
    return { allowed: true }
  }
}

export function resolveAssistantRequestsPerMinute(
  environment: AssistantRolloutEnvironment
) {
  return resolveAssistantPreviewRolloutPercent(environment) > 0 ?
      PREVIEW_REQUESTS_PER_MINUTE
    : 0
}

export function createAssistantRouteHandler(
  dependencies: AssistantRouteDependencies
) {
  return async function handleAssistantRequest(
    request: Request,
    context: AssistantRouteRequestContext = {}
  ): Promise<Response> {
    if (!hasSameOrigin(request)) {
      return errorResponse('forbidden_origin', 403)
    }

    if (!hasJsonMediaType(request)) {
      return errorResponse('unsupported_media_type', 415)
    }

    const declaredBodyLength = parseDeclaredBodyLength(request)
    if (declaredBodyLength.status === 'invalid') {
      return errorResponse('invalid_request', 400)
    }

    if (
      declaredBodyLength.status === 'valid' &&
      declaredBodyLength.byteLength > MAX_BODY_BYTES
    ) {
      return errorResponse('payload_too_large', 413)
    }

    let body
    try {
      body = await readBoundedBody(request)
    } catch {
      return errorResponse('invalid_request', 400)
    }

    if (body.exceeded) {
      return errorResponse('payload_too_large', 413)
    }

    let parsed
    try {
      parsed = parseAssistantChatRequest(JSON.parse(body.text))
    } catch {
      return errorResponse('invalid_request', 400)
    }

    let rateLimit
    try {
      rateLimit = await dependencies.checkRateLimit({
        sessionId: parsed.sessionId,
        request
      })
    } catch {
      rateLimit = { allowed: false }
    }

    if (!rateLimit.allowed) {
      return errorResponse('rate_limited', 429, {
        'Retry-After': '60'
      })
    }

    const stream = createUIMessageStream<AssistantUIMessage>({
      execute: async ({ writer }) => {
        const startedAt = dependencies.now()

        try {
          const outcome = await dependencies.answer(parsed, {
            ...context,
            failureCount: 0
          })
          const recommendations = outcome.recommendations.map(
            recommendation =>
              assistantRecommendationSchema.parse(recommendation)
          )
          const textId = crypto.randomUUID()

          writer.write({ type: 'text-start', id: textId })
          writer.write({
            type: 'text-delta',
            id: textId,
            delta: outcome.text
          })
          writer.write({ type: 'text-end', id: textId })

          for (const recommendation of recommendations) {
            writer.write({
              type: 'data-recommendation',
              data: recommendation
            })
          }

          for (const source of outcome.sources) {
            writer.write({ type: 'data-source', data: source })
          }

          if (outcome.handoff) {
            writer.write({
              type: 'data-handoff',
              data: outcome.handoff
            })
          }

          writer.write({
            type: 'data-status',
            data: {
              confidence: outcome.confidence,
              failureCode: outcome.failureCode
            }
          })

          logAssistantOutcome({
            sessionId: parsed.sessionId,
            intent: parsed.intent,
            outcomeCode: outcome.failureCode,
            latencyMs: measureLatency(
              dependencies.now,
              startedAt
            )
          })
        } catch {
          logAssistantOutcome({
            sessionId: parsed.sessionId,
            intent: parsed.intent,
            outcomeCode: 'stream_error',
            latencyMs: measureLatency(
              dependencies.now,
              startedAt
            )
          })
          throw new Error('assistant_stream_failed')
        }
      },
      onError: () => SAFE_STREAM_ERROR
    })

    return createUIMessageStreamResponse({
      stream,
      headers: NO_STORE_HEADERS
    })
  }
}
