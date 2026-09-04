import { timingSafeEqual } from 'node:crypto'

export function verifyMetaCatalogWebhookToken(input: {
  expected: string | undefined
  supplied: string | null
}) {
  const expectedValue = input.expected?.trim()
  const suppliedValue = input.supplied?.trim()

  if (!expectedValue || !suppliedValue) return false

  const expected = Buffer.from(expectedValue)
  const supplied = Buffer.from(suppliedValue)

  return (
    supplied.length === expected.length &&
    timingSafeEqual(supplied, expected)
  )
}
