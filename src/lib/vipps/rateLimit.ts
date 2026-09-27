import 'server-only'
import { createHmac } from 'node:crypto'
import { getRedis } from '@/lib/redis/getRedis'

export async function vippsRateLimit(
  scope: string,
  identity: string,
  limit: number,
  seconds: number,
  secret: string
) {
  const redis = await getRedis()
  const hash = createHmac('sha256', secret)
    .update(identity)
    .digest('hex')
    .slice(0, 32)
  const key = `commerce:vipps:rate:v1:${scope}:${hash}:${Math.floor(Date.now() / (seconds * 1000))}`
  // TTL and count update atomically. Redis failure fails closed before any external creation.
  const count = await redis.eval(
    'local n=redis.call(\'INCR\',KEYS[1]); if n==1 then redis.call(\'EXPIRE\',KEYS[1],ARGV[1]) end; return n',
    { keys: [key], arguments: [String(seconds * 2)] }
  )
  return typeof count === 'number' && count <= limit
}
