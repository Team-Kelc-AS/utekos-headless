import assert from 'node:assert/strict'
import test from 'node:test'
import { createRedisAssistantRateLimiter } from './redisAssistantRateLimiter'

const environment = {
  UPSTASH_REDIS_REST_URL: 'https://redis.example.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'token-that-is-never-returned',
  CUSTOMER_ASSISTANT_RATE_LIMIT_SECRET:
    'rate-limit-secret-with-at-least-32-characters'
}

const request = new Request(
  'https://utekos.no/api/customer-assistant/chat',
  { method: 'POST' }
)

test('fails closed without every distributed limiter credential', async () => {
  let createCalls = 0
  const checkRateLimit = createRedisAssistantRateLimiter(
    { environment: {}, limit: 12, namespace: 'chat' },
    {
      createRedis() {
        createCalls += 1
        throw new Error('must not create a client')
      }
    }
  )

  assert.deepEqual(
    await checkRateLimit({
      buyerIp: '203.0.113.8',
      request,
      sessionId: 'session-raw-value'
    }),
    { allowed: false }
  )
  assert.equal(createCalls, 0)
})

test('uses one atomic expiring counter and never exposes raw identifiers in the Redis key', async () => {
  const evaluations: Array<{
    args: string[]
    keys: string[]
    script: string
  }> = []
  let count = 0
  const checkRateLimit = createRedisAssistantRateLimiter(
    { environment, limit: 2, namespace: 'chat' },
    {
      createRedis(config) {
        assert.equal(config.url, environment.UPSTASH_REDIS_REST_URL)
        assert.equal(config.token, environment.UPSTASH_REDIS_REST_TOKEN)
        return {
          async eval(script, keys, args) {
            evaluations.push({ script, keys, args })
            count += 1
            return [count, 60_000]
          }
        }
      }
    }
  )
  const input = {
    buyerIp: '203.0.113.8',
    request,
    sessionId: 'session-raw-value'
  }

  assert.deepEqual(await checkRateLimit(input), {
    allowed: true
  })
  assert.deepEqual(await checkRateLimit(input), {
    allowed: true
  })
  assert.deepEqual(await checkRateLimit(input), {
    allowed: false
  })

  assert.equal(evaluations.length, 3)
  assert.match(evaluations[0]?.script ?? '', /INCR/u)
  assert.match(evaluations[0]?.script ?? '', /PEXPIRE/u)
  assert.deepEqual(evaluations[0]?.args, ['60000'])
  const serializedKey = JSON.stringify(evaluations[0]?.keys)
  assert.doesNotMatch(serializedKey, /session-raw-value/u)
  assert.doesNotMatch(serializedKey, /203\.0\.113\.8/u)
  assert.match(serializedKey, /customer-assistant:rate:chat:v1/u)
})

test('fails closed on Redis failures and malformed script results', async t => {
  for (const result of [
    null,
    [],
    ['one', 60_000],
    [1],
    [1, -1]
  ]) {
    await t.test(JSON.stringify(result), async () => {
      const checkRateLimit = createRedisAssistantRateLimiter(
        { environment, limit: 12, namespace: 'chat' },
        {
          createRedis: () => ({
            eval: async () => result
          })
        }
      )

      assert.deepEqual(
        await checkRateLimit({ request, sessionId: 'session' }),
        { allowed: false }
      )
    })
  }

  const unavailable = createRedisAssistantRateLimiter(
    { environment, limit: 12, namespace: 'chat' },
    {
      createRedis: () => ({
        eval: async () => {
          throw new Error('credential detail must not escape')
        }
      })
    }
  )
  assert.deepEqual(
    await unavailable({ request, sessionId: 'session' }),
    { allowed: false }
  )
})
