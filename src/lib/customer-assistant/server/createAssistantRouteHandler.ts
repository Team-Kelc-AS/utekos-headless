import {
  createUIMessageStream,
  createUIMessageStreamResponse
} from 'ai'
import {
  parseAssistantChatRequest,
  type AssistantUIMessage
} from '../assistantProtocol'
import {
  answerAssistantRequest,
  type AssistantOutcome
} from './answerAssistantRequest'

const MAX_BODY_BYTES = 24 * 1024
const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_TRACKED_SESSIONS = 10_000
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
  return (
    request.headers
      .get('content-type')
      ?.split(';', 1)[0]
      ?.trim()
      .toLowerCase() === 'application/json'
  )
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
      parsedOrigin.origin === new URL(request.url).origin
    )
  } catch {
    return false
  }
}

function exceedsDeclaredBodyLimit(request: Request) {
  const value = request.headers.get('content-length')
  if (value === null || !/^\d+$/u.test(value.trim())) {
    return false
  }

  try {
    return BigInt(value.trim()) > BigInt(MAX_BODY_BYTES)
  } catch {
    return false
  }
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

    if (exceedsDeclaredBodyLimit(request)) {
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
          const textId = crypto.randomUUID()

          writer.write({ type: 'text-start', id: textId })
          writer.write({
            type: 'text-delta',
            id: textId,
            delta: outcome.text
          })
          writer.write({ type: 'text-end', id: textId })

          for (const recommendation of outcome.recommendations) {
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
