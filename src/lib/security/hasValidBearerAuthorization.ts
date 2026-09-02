import { timingSafeEqual } from 'node:crypto'

export function hasValidBearerAuthorization(
  authorization: string | null,
  secret: string | undefined
) {
  if (!authorization || !secret) return false

  const provided = Buffer.from(authorization)
  const expected = Buffer.from(`Bearer ${secret}`)

  return (
    provided.length === expected.length &&
    timingSafeEqual(provided, expected)
  )
}
