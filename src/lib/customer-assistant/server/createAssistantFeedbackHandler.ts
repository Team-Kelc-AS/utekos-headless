import { createHmac } from 'node:crypto'
import { z } from 'zod'
import { resolveAssistantDeploymentRolloutPercent } from '../assistantRollout'
import type {
  AssistantFeedbackRating,
  AssistantFeedbackStore
} from './assistantFeedbackStore'
import type {
  AssistantRateLimitCheck,
  AssistantRateLimitInput
} from './redisAssistantRateLimiter'

const MAX_BODY_BYTES = 1024
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0'
}
const SECRET_MINIMUM_CHARACTERS = 32

const feedbackSchema = z
  .object({
    responseId: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z0-9_-]+$/u),
    value: z.enum(['helpful', 'not_helpful'])
  })
  .strict()

type Environment = Readonly<Record<string, string | undefined>>

type AssistantFeedbackDependencies = Readonly<{
  checkRateLimit: AssistantRateLimitCheck
  environment: Environment
  store: AssistantFeedbackStore
}>

type AssistantFeedbackContext = Readonly<{
  buyerIp?: string | undefined
}>

function errorResponse(error: string, status: number) {
  return Response.json(
    { error },
    { headers: NO_STORE_HEADERS, status }
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

function hasJsonMediaType(request: Request) {
  return (
    request.headers
      .get('content-type')
      ?.split(';', 1)[0]
      ?.trim()
      .toLowerCase() === 'application/json'
  )
}

async function readBoundedBody(request: Request) {
  const declaredLength = request.headers.get('content-length')
  if (declaredLength !== null) {
    if (!/^\d+$/u.test(declaredLength.trim())) return null
    if (Number(declaredLength) > MAX_BODY_BYTES) return null
  }

  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => undefined)
        return null
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const body = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(body)
  } catch {
    return null
  }
}

function readFeedbackSecret(environment: Environment) {
  const secret = environment.CUSTOMER_ASSISTANT_FEEDBACK_SECRET
  if (
    !secret ||
    secret.trim() !== secret ||
    secret.length < SECRET_MINIMUM_CHARACTERS
  ) {
    return null
  }

  return secret
}

function createResponseFingerprint(
  secret: string,
  responseId: string
) {
  return createHmac('sha256', secret)
    .update(`assistant-feedback-v1\u0000${responseId}`)
    .digest('hex')
}

export function createAssistantFeedbackHandler(
  dependencies: AssistantFeedbackDependencies
) {
  return async function handleAssistantFeedback(
    request: Request,
    context: AssistantFeedbackContext = {}
  ) {
    if (
      resolveAssistantDeploymentRolloutPercent(
        dependencies.environment
      ) === 0
    ) {
      return errorResponse('not_found', 404)
    }

    if (!hasSameOrigin(request)) {
      return errorResponse('forbidden_origin', 403)
    }
    if (!hasJsonMediaType(request)) {
      return errorResponse('unsupported_media_type', 415)
    }

    const text = await readBoundedBody(request)
    if (text === null) return errorResponse('invalid_request', 400)

    let feedback: {
      responseId: string
      value: AssistantFeedbackRating
    }
    try {
      feedback = feedbackSchema.parse(JSON.parse(text))
    } catch {
      return errorResponse('invalid_request', 400)
    }

    const rateLimitInput: AssistantRateLimitInput = {
      buyerIp: context.buyerIp,
      request,
      sessionId: 'feedback'
    }
    let rateLimit
    try {
      rateLimit = await dependencies.checkRateLimit(rateLimitInput)
    } catch {
      rateLimit = { allowed: false }
    }
    if (!rateLimit.allowed) {
      return errorResponse('rate_limited', 429)
    }

    const secret = readFeedbackSecret(dependencies.environment)
    if (!secret) {
      return errorResponse('feedback_unavailable', 503)
    }

    try {
      await dependencies.store.save({
        rating: feedback.value,
        responseFingerprint: createResponseFingerprint(
          secret,
          feedback.responseId
        )
      })
    } catch {
      return errorResponse('feedback_unavailable', 503)
    }

    return new Response(null, {
      headers: NO_STORE_HEADERS,
      status: 204
    })
  }
}
