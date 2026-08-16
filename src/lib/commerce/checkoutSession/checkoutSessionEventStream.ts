import 'server-only'

import { getRedis } from '@/lib/redis/getRedis'

import {
  CHECKOUT_SESSION_EVENT_STREAM_KEY
} from './checkoutSessionKeys'

import {
  checkoutSessionEventSchema,
  type CheckoutSessionEvent
} from './checkoutSessionEvent'

/**
 * Redis Cloud database is intentionally small.
 *
 * The Stream is an operational journal,
 * not the durable materialized CheckoutSession.
 *
 * Approximate trimming avoids an unbounded stream
 * while keeping enough recent lifecycle history
 * for diagnostics and consumers.
 */
export const CHECKOUT_SESSION_EVENT_STREAM_MAX_LENGTH =
  10_000

export type CheckoutSessionEventStreamRedisClient = {
  sendCommand(
    command: string[]
  ): Promise<unknown>
}

type CheckoutSessionEventStreamDependencies = {
  getClient?: () =>
    Promise<CheckoutSessionEventStreamRedisClient>
}

export class CheckoutSessionEventStreamError
  extends Error
{
  override readonly name =
    'CheckoutSessionEventStreamError'
}

export type AppendCheckoutSessionEventResult = {
  stream_id: string
  event: CheckoutSessionEvent
}

async function defaultGetClient(): Promise<CheckoutSessionEventStreamRedisClient> {
  const client =
    await getRedis()

  return {
    async sendCommand(
      command
    ) {
      return client.sendCommand(
        command
      )
    }
  }
}

function assertRedisStreamId(
  value: unknown
): asserts value is string {
  if (
    typeof value !== 'string' ||
    !/^\d+-\d+$/.test(value)
  ) {
    throw new CheckoutSessionEventStreamError(
      'Redis XADD returned an invalid Stream ID'
    )
  }
}

function buildXaddCommand(
  event: CheckoutSessionEvent
): string[] {
  return [
    'XADD',

    CHECKOUT_SESSION_EVENT_STREAM_KEY,

    'MAXLEN',
    '~',
    String(
      CHECKOUT_SESSION_EVENT_STREAM_MAX_LENGTH
    ),

    '*',

    'schema',
    event.schema,

    'event_id',
    event.event_id,

    'event_type',
    event.event_type,

    'source',
    event.source,

    'occurred_at',
    event.occurred_at,

    'session_id',
    event.session_id,

    'session_revision',
    String(
      event.session_revision
    ),

    'cart_token',
    event.cart_token,

    'attempt_id',
    event.attempt_id ?? '',

    'metadata',
    JSON.stringify(
      event.metadata
    )
  ]
}

export function createCheckoutSessionEventStream(
  dependencies: CheckoutSessionEventStreamDependencies = {}
) {
  const getClient =
    dependencies.getClient ??
    defaultGetClient

  return {
    async append(
      candidate: CheckoutSessionEvent
    ): Promise<AppendCheckoutSessionEventResult> {
      const event =
        checkoutSessionEventSchema.parse(
          candidate
        )

      const client =
        await getClient()

      const streamId =
        await client.sendCommand(
          buildXaddCommand(
            event
          )
        )

      assertRedisStreamId(
        streamId
      )

      return {
        stream_id:
          streamId,

        event
      }
    }
  }
}

export type CheckoutSessionEventStream =
  ReturnType<
    typeof createCheckoutSessionEventStream
  >

export const redisCheckoutSessionEventStream =
  createCheckoutSessionEventStream()