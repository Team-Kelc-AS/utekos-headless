// Path: src/lib/redis.ts
import { createClient, type RedisClientType } from 'redis'
import { logRedisClientError } from '@/lib/redis/logRedisClientError'
import {
  REDIS_COMMAND_TIMEOUT_MS,
  REDIS_CONNECT_TIMEOUT_MS
} from '@/lib/redis/redisConnectionConfig'
import { shouldStopRedisReconnect } from '@/lib/redis/shouldStopRedisReconnect'

type EmptyRedisExtension = Record<never, never>
type UtekosRedisClient = RedisClientType<
  EmptyRedisExtension,
  EmptyRedisExtension,
  EmptyRedisExtension,
  2
>

let _client: UtekosRedisClient | null = null
let _connectPromise: Promise<UtekosRedisClient> | null = null

export async function getRedis(): Promise<UtekosRedisClient> {
  if (_client?.isReady) return _client

  // Prevent multiple simultaneous connection attempts
  if (_connectPromise) return _connectPromise

  _connectPromise = (async () => {
    const url = process.env.REDIS_URL
    if (!url) throw new Error('Missing REDIS_URL')

    const client = createClient({
      url,
      RESP: 2,
      commandOptions: {
        timeout: REDIS_COMMAND_TIMEOUT_MS
      },
      socket: {
        reconnectStrategy: (retries, cause) => {
          if (shouldStopRedisReconnect(retries, cause)) return false

          return Math.min(retries * 50, 500)
        },
        connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
        keepAlive: true
      }
    })

    _client = client

    client.on('error', logRedisClientError)
    client.on('reconnecting', () => console.warn('Redis Client Reconnecting'))
    client.on('ready', () => console.info('Redis Client Ready'))

    try {
      if (!client.isOpen) {
        await client.connect()
      }

      return client
    } catch (error) {
      if (_client === client) {
        _client = null
      }

      client.destroy()
      throw error
    }
  })()

  try {
    return await _connectPromise
  } finally {
    _connectPromise = null
  }
}
