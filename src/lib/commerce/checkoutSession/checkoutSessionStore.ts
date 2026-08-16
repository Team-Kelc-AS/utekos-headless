import 'server-only'

import { getRedis } from '@/lib/redis/getRedis'

import {
  checkoutSessionSchema,
  type CheckoutSession
} from './checkoutSessionSchema'

import {
  checkoutAttemptIndexKey,
  checkoutBeginEventIndexKey,
  checkoutKlarnaOrderIndexKey,
  checkoutSessionByCartTokenKey,
  checkoutSessionIdIndexKey,
  checkoutShopifyAbandonmentIndexKey,
  checkoutShopifyOrderIndexKey
} from './checkoutSessionKeys'

export type CheckoutSessionRedisClient = {
  get(
    key: string
  ): Promise<string | null>

  eval(
    script: string,
    options: {
      keys: string[]
      arguments: string[]
    }
  ): Promise<unknown>
}

type CheckoutSessionStoreDependencies = {
  getClient?: () => Promise<CheckoutSessionRedisClient>
  now?: () => Date
}

export type CreateCheckoutSessionResult =
  | {
      status: 'created'
      session: CheckoutSession
    }
  | {
      status: 'exists'
      current: CheckoutSession
    }

export type CompareAndSetCheckoutSessionResult =
  | {
      status: 'updated'
      session: CheckoutSession
    }
  | {
      status: 'conflict'
      current: CheckoutSession
    }
  | {
      status: 'missing'
    }

export class CheckoutSessionStoreError extends Error {
  override readonly name =
    'CheckoutSessionStoreError'
}

export class CheckoutSessionCorruptionError extends Error {
  override readonly name =
    'CheckoutSessionCorruptionError'

  constructor(
    readonly redisKey: string,
    message: string
  ) {
    super(message)
  }
}

export class CheckoutSessionIndexConflictError extends Error {
  override readonly name =
    'CheckoutSessionIndexConflictError'

  constructor(
    readonly redisKey: string
  ) {
    super(
      `Checkout Session Registry index is already owned by another cart: ${redisKey}`
    )
  }
}

/**
 * CREATE invariants:
 *
 * 1. Primary session key must not exist.
 * 2. No secondary index may belong to another cart.
 * 3. Primary record and all indexes are written atomically.
 * 4. Every key receives the exact same TTL.
 */
const CREATE_SESSION_SCRIPT = String.raw`
local existing = redis.call('GET', KEYS[1])

if existing then
  return cjson.encode({
    status = 'exists',
    current = existing
  })
end

for index = 2, #KEYS do
  local indexedCartToken = redis.call(
    'GET',
    KEYS[index]
  )

  if indexedCartToken and indexedCartToken ~= ARGV[3] then
    return cjson.encode({
      status = 'index_conflict',
      key = KEYS[index]
    })
  end
end

redis.call(
  'SET',
  KEYS[1],
  ARGV[1],
  'EX',
  ARGV[2]
)

for index = 2, #KEYS do
  redis.call(
    'SET',
    KEYS[index],
    ARGV[3],
    'EX',
    ARGV[2]
  )
end

return cjson.encode({
  status = 'created'
})
`

/**
 * COMPARE-AND-SET invariants:
 *
 * 1. Existing revision must equal expectedRevision.
 * 2. session_id can never change.
 * 3. cart_token can never change.
 * 4. No secondary index can be stolen from another cart.
 * 5. Session + indexes are written atomically.
 */
const COMPARE_AND_SET_SESSION_SCRIPT = String.raw`
local currentRaw = redis.call(
  'GET',
  KEYS[1]
)

if not currentRaw then
  return cjson.encode({
    status = 'missing'
  })
end

local current = cjson.decode(
  currentRaw
)

local expectedRevision = tonumber(
  ARGV[1]
)

if tonumber(current.revision) ~= expectedRevision then
  return cjson.encode({
    status = 'conflict',
    current = currentRaw
  })
end

local nextSession = cjson.decode(
  ARGV[2]
)

if current.session_id ~= nextSession.session_id then
  return cjson.encode({
    status = 'identity_mismatch',
    field = 'session_id'
  })
end

if
  current.shopify_cart.cart_token ~=
  nextSession.shopify_cart.cart_token
then
  return cjson.encode({
    status = 'identity_mismatch',
    field = 'cart_token'
  })
end

for index = 2, #KEYS do
  local indexedCartToken = redis.call(
    'GET',
    KEYS[index]
  )

  if indexedCartToken and indexedCartToken ~= ARGV[4] then
    return cjson.encode({
      status = 'index_conflict',
      key = KEYS[index]
    })
  end
end

redis.call(
  'SET',
  KEYS[1],
  ARGV[2],
  'EX',
  ARGV[3]
)

for index = 2, #KEYS do
  redis.call(
    'SET',
    KEYS[index],
    ARGV[4],
    'EX',
    ARGV[3]
  )
end

return cjson.encode({
  status = 'updated'
})
`

type RedisScriptEnvelope = {
  status: string
  current?: string
  key?: string
  field?: string
}

function validateCanonicalCartToken(
  cartToken: string
): void {
  if (
    cartToken.length === 0 ||
    cartToken !== cartToken.trim()
  ) {
    throw new CheckoutSessionStoreError(
      'Shopify cart token must be a canonical non-empty value'
    )
  }
}

function parseStoredSession(
  raw: string,
  redisKey: string
): CheckoutSession {
  let parsedJson: unknown

  try {
    parsedJson = JSON.parse(raw)
  } catch {
    throw new CheckoutSessionCorruptionError(
      redisKey,
      `Checkout Session Registry contains invalid JSON at ${redisKey}`
    )
  }

  const parsed =
    checkoutSessionSchema.safeParse(
      parsedJson
    )

  if (!parsed.success) {
    throw new CheckoutSessionCorruptionError(
      redisKey,
      `Checkout Session Registry contains an invalid session at ${redisKey}`
    )
  }

  return parsed.data
}

function parseScriptEnvelope(
  result: unknown
): RedisScriptEnvelope {
  if (typeof result !== 'string') {
    throw new CheckoutSessionStoreError(
      'Redis Checkout Session script returned a non-string result'
    )
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(result)
  } catch {
    throw new CheckoutSessionStoreError(
      'Redis Checkout Session script returned invalid JSON'
    )
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('status' in parsed) ||
    typeof parsed.status !== 'string'
  ) {
    throw new CheckoutSessionStoreError(
      'Redis Checkout Session script returned an invalid envelope'
    )
  }

  return parsed as RedisScriptEnvelope
}

function calculateRedisTtlSeconds(
  session: CheckoutSession,
  now: Date
): number {
  const expiresAt =
    Date.parse(session.expires_at)

  const nowMs = now.getTime()

  if (
    Number.isNaN(expiresAt) ||
    Number.isNaN(nowMs)
  ) {
    throw new CheckoutSessionStoreError(
      'Cannot calculate Checkout Session Redis TTL'
    )
  }

  const remainingMs =
    expiresAt - nowMs

  if (remainingMs <= 0) {
    throw new CheckoutSessionStoreError(
      'Cannot persist an expired Checkout Session'
    )
  }

  return Math.max(
    1,
    Math.ceil(remainingMs / 1000)
  )
}

function collectSecondaryIndexKeys(
  session: CheckoutSession
): string[] {
  const keys = new Set<string>()

  keys.add(
    checkoutSessionIdIndexKey(
      session.session_id
    )
  )

  for (
    const attempt of
    session.checkout_attempts
  ) {
    keys.add(
      checkoutAttemptIndexKey(
        attempt.attempt_id
      )
    )

    if (
      attempt.begin_checkout_event_id
    ) {
      keys.add(
        checkoutBeginEventIndexKey(
          attempt.begin_checkout_event_id
        )
      )
    }

    if (
      attempt.shopify
        ?.abandoned_checkout_id
    ) {
      keys.add(
        checkoutShopifyAbandonmentIndexKey(
          attempt.shopify
            .abandoned_checkout_id
        )
      )
    }

    if (
      attempt.klarna?.klarna_order_id
    ) {
      keys.add(
        checkoutKlarnaOrderIndexKey(
          attempt.klarna.klarna_order_id
        )
      )
    }

    if (
      attempt.klarna
        ?.shopify_order_id
    ) {
      keys.add(
        checkoutShopifyOrderIndexKey(
          attempt.klarna
            .shopify_order_id
        )
      )
    }
  }

  if (
    session.conversion
      ?.shopify_order_id
  ) {
    keys.add(
      checkoutShopifyOrderIndexKey(
        session.conversion
          .shopify_order_id
      )
    )
  }

  return [...keys]
}

async function defaultGetClient(): Promise<CheckoutSessionRedisClient> {
  const client = await getRedis()

  return {
    get(key) {
      return client.get(key)
    },

    eval(script, options) {
      return client.eval(
        script,
        options
      )
    }
  }
}

export function createCheckoutSessionStore(
  dependencies: CheckoutSessionStoreDependencies = {}
) {
  const getClient =
    dependencies.getClient ??
    defaultGetClient

  const now =
    dependencies.now ??
    (() => new Date())

  async function getByCartTokenWithClient(
    client: CheckoutSessionRedisClient,
    cartToken: string
  ): Promise<CheckoutSession | null> {
    validateCanonicalCartToken(
      cartToken
    )

    const redisKey =
      checkoutSessionByCartTokenKey(
        cartToken
      )

    const raw =
      await client.get(redisKey)

    if (raw === null) {
      return null
    }

    return parseStoredSession(
      raw,
      redisKey
    )
  }

  async function getByIndexKey(
    indexKey: string
  ): Promise<CheckoutSession | null> {
    const client =
      await getClient()

    const cartToken =
      await client.get(indexKey)

    if (cartToken === null) {
      return null
    }

    return getByCartTokenWithClient(
      client,
      cartToken
    )
  }

  return {
    async getByCartToken(
      cartToken: string
    ): Promise<CheckoutSession | null> {
      const client =
        await getClient()

      return getByCartTokenWithClient(
        client,
        cartToken
      )
    },

    async getBySessionId(
      sessionId: string
    ): Promise<CheckoutSession | null> {
      return getByIndexKey(
        checkoutSessionIdIndexKey(
          sessionId
        )
      )
    },

    async getByAttemptId(
      attemptId: string
    ): Promise<CheckoutSession | null> {
      return getByIndexKey(
        checkoutAttemptIndexKey(
          attemptId
        )
      )
    },

    async getByBeginCheckoutEventId(
      eventId: string
    ): Promise<CheckoutSession | null> {
      return getByIndexKey(
        checkoutBeginEventIndexKey(
          eventId
        )
      )
    },

    async getByShopifyAbandonedCheckoutId(
      abandonedCheckoutId: string
    ): Promise<CheckoutSession | null> {
      return getByIndexKey(
        checkoutShopifyAbandonmentIndexKey(
          abandonedCheckoutId
        )
      )
    },

    async getByKlarnaOrderId(
      klarnaOrderId: string
    ): Promise<CheckoutSession | null> {
      return getByIndexKey(
        checkoutKlarnaOrderIndexKey(
          klarnaOrderId
        )
      )
    },

    async getByShopifyOrderId(
      shopifyOrderId: string
    ): Promise<CheckoutSession | null> {
      return getByIndexKey(
        checkoutShopifyOrderIndexKey(
          shopifyOrderId
        )
      )
    },

    async create(
      candidate: CheckoutSession
    ): Promise<CreateCheckoutSessionResult> {
      const session =
        checkoutSessionSchema.parse(
          candidate
        )

      if (session.revision !== 0) {
        throw new CheckoutSessionStoreError(
          'New Checkout Sessions must start at revision 0'
        )
      }

      validateCanonicalCartToken(
        session.shopify_cart.cart_token
      )

      const client =
        await getClient()

      const primaryKey =
        checkoutSessionByCartTokenKey(
          session.shopify_cart
            .cart_token
        )

      const secondaryKeys =
        collectSecondaryIndexKeys(
          session
        )

      const ttlSeconds =
        calculateRedisTtlSeconds(
          session,
          now()
        )

      const payload =
        JSON.stringify(session)

      const rawResult =
        await client.eval(
          CREATE_SESSION_SCRIPT,
          {
            keys: [
              primaryKey,
              ...secondaryKeys
            ],

            arguments: [
              payload,
              String(ttlSeconds),
              session.shopify_cart
                .cart_token
            ]
          }
        )

      const result =
        parseScriptEnvelope(
          rawResult
        )

      if (
        result.status === 'created'
      ) {
        return {
          status: 'created',
          session
        }
      }

      if (
        result.status === 'exists' &&
        typeof result.current ===
          'string'
      ) {
        return {
          status: 'exists',
          current:
            parseStoredSession(
              result.current,
              primaryKey
            )
        }
      }

      if (
        result.status ===
          'index_conflict' &&
        typeof result.key === 'string'
      ) {
        throw new CheckoutSessionIndexConflictError(
          result.key
        )
      }

      throw new CheckoutSessionStoreError(
        `Unexpected Checkout Session create result: ${result.status}`
      )
    },

    async compareAndSet(input: {
      cartToken: string
      expectedRevision: number
      nextSession: CheckoutSession
    }): Promise<CompareAndSetCheckoutSessionResult> {
      validateCanonicalCartToken(
        input.cartToken
      )

      if (
        !Number.isInteger(
          input.expectedRevision
        ) ||
        input.expectedRevision < 0
      ) {
        throw new CheckoutSessionStoreError(
          'expectedRevision must be a non-negative integer'
        )
      }

      const nextSession =
        checkoutSessionSchema.parse(
          input.nextSession
        )

      if (
        nextSession.shopify_cart
          .cart_token !==
        input.cartToken
      ) {
        throw new CheckoutSessionStoreError(
          'compareAndSet cannot change the Shopify cart token'
        )
      }

      if (
        nextSession.revision !==
        input.expectedRevision + 1
      ) {
        throw new CheckoutSessionStoreError(
          'nextSession.revision must equal expectedRevision + 1'
        )
      }

      const client =
        await getClient()

      const primaryKey =
        checkoutSessionByCartTokenKey(
          input.cartToken
        )

      const secondaryKeys =
        collectSecondaryIndexKeys(
          nextSession
        )

      const ttlSeconds =
        calculateRedisTtlSeconds(
          nextSession,
          now()
        )

      const payload =
        JSON.stringify(nextSession)

      const rawResult =
        await client.eval(
          COMPARE_AND_SET_SESSION_SCRIPT,
          {
            keys: [
              primaryKey,
              ...secondaryKeys
            ],

            arguments: [
              String(
                input.expectedRevision
              ),
              payload,
              String(ttlSeconds),
              input.cartToken
            ]
          }
        )

      const result =
        parseScriptEnvelope(
          rawResult
        )

      if (
        result.status === 'updated'
      ) {
        return {
          status: 'updated',
          session: nextSession
        }
      }

      if (
        result.status === 'missing'
      ) {
        return {
          status: 'missing'
        }
      }

      if (
        result.status ===
          'conflict' &&
        typeof result.current ===
          'string'
      ) {
        return {
          status: 'conflict',
          current:
            parseStoredSession(
              result.current,
              primaryKey
            )
        }
      }

      if (
        result.status ===
          'index_conflict' &&
        typeof result.key === 'string'
      ) {
        throw new CheckoutSessionIndexConflictError(
          result.key
        )
      }

      if (
        result.status ===
        'identity_mismatch'
      ) {
        throw new CheckoutSessionStoreError(
          `Checkout Session identity mismatch: ${result.field ?? 'unknown'}`
        )
      }

      throw new CheckoutSessionStoreError(
        `Unexpected Checkout Session compare-and-set result: ${result.status}`
      )
    }
  }
}

export type CheckoutSessionStore =
  ReturnType<
    typeof createCheckoutSessionStore
  >

export const redisCheckoutSessionStore =
  createCheckoutSessionStore()