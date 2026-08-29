import { createHmac } from 'node:crypto'
import { Redis } from '@upstash/redis'

const RATE_LIMIT_WINDOW_MS = 60_000
const SECRET_MINIMUM_CHARACTERS = 32
const NAMESPACE_PATTERN = /^[a-z][a-z0-9-]{0,31}$/u

const FIXED_WINDOW_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return { current, ttl }
`

type Environment = Readonly<Record<string, string | undefined>>

type RedisConfiguration = Readonly<{
  token: string
  url: string
}>

type RedisEvalClient = {
  eval(
    script: string,
    keys: string[],
    args: string[]
  ): Promise<unknown>
}

export type AssistantRateLimitInput = Readonly<{
  buyerIp?: string | undefined
  request: Request
  sessionId: string
}>

export type AssistantRateLimitCheck = (
  input: AssistantRateLimitInput
) => Promise<{ allowed: boolean }>

type RedisAssistantRateLimiterOptions = Readonly<{
  environment: Environment
  limit: number
  namespace: string
}>

type RedisAssistantRateLimiterDependencies = Readonly<{
  createRedis: (configuration: RedisConfiguration) => RedisEvalClient
}>

const defaultDependencies: RedisAssistantRateLimiterDependencies = {
  createRedis: configuration => new Redis(configuration)
}

function readRedisConfiguration(environment: Environment) {
  const url = environment.UPSTASH_REDIS_REST_URL?.trim()
  const token = environment.UPSTASH_REDIS_REST_TOKEN?.trim()
  const secret =
    environment.CUSTOMER_ASSISTANT_RATE_LIMIT_SECRET

  if (
    !url ||
    !token ||
    !secret ||
    secret.trim() !== secret ||
    secret.length < SECRET_MINIMUM_CHARACTERS
  ) {
    return null
  }

  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'https:') return null
  } catch {
    return null
  }

  return { configuration: { token, url }, secret }
}

function createRateLimitKey({
  buyerIp,
  namespace,
  secret,
  sessionId
}: {
  buyerIp?: string | undefined
  namespace: string
  secret: string
  sessionId: string
}) {
  const identifier = `${namespace}\u0000${sessionId}\u0000${buyerIp ?? ''}`
  const digest = createHmac('sha256', secret)
    .update(identifier)
    .digest('hex')

  return `customer-assistant:rate:${namespace}:v1:${digest}`
}

function parseCounterResult(result: unknown) {
  if (
    !Array.isArray(result) ||
    result.length !== 2 ||
    typeof result[0] !== 'number' ||
    !Number.isSafeInteger(result[0]) ||
    result[0] < 1 ||
    typeof result[1] !== 'number' ||
    !Number.isFinite(result[1]) ||
    result[1] < 0
  ) {
    return null
  }

  return result[0]
}

export function createRedisAssistantRateLimiter(
  options: RedisAssistantRateLimiterOptions,
  dependencies: RedisAssistantRateLimiterDependencies =
    defaultDependencies
): AssistantRateLimitCheck {
  const normalizedLimit =
    Number.isSafeInteger(options.limit) && options.limit > 0 ?
      options.limit
    : 0
  const normalizedNamespace =
    NAMESPACE_PATTERN.test(options.namespace) ?
      options.namespace
    : null
  const redisConfiguration = readRedisConfiguration(
    options.environment
  )

  if (
    normalizedLimit === 0 ||
    normalizedNamespace === null ||
    redisConfiguration === null
  ) {
    return async () => ({ allowed: false })
  }

  let redis: RedisEvalClient | null = null

  return async input => {
    if (!input.sessionId) return { allowed: false }

    try {
      redis ??= dependencies.createRedis(
        redisConfiguration.configuration
      )
      const key = createRateLimitKey({
        buyerIp: input.buyerIp,
        namespace: normalizedNamespace,
        secret: redisConfiguration.secret,
        sessionId: input.sessionId
      })
      const result = await redis.eval(
        FIXED_WINDOW_SCRIPT,
        [key],
        [String(RATE_LIMIT_WINDOW_MS)]
      )
      const count = parseCounterResult(result)

      return {
        allowed: count !== null && count <= normalizedLimit
      }
    } catch {
      return { allowed: false }
    }
  }
}
