import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifyMetaCatalogWebhookSignature(input: {
  appSecret: string | undefined
  payload: string
  signature: string | null
}) {
  const appSecret = input.appSecret?.trim()
  const signature = input.signature?.trim()

  if (!appSecret || !signature?.startsWith('sha256=')) return false

  const supplied = Buffer.from(signature.slice('sha256='.length), 'hex')
  const expected = Buffer.from(
    createHmac('sha256', appSecret).update(input.payload).digest('hex'),
    'hex'
  )

  return (
    supplied.length === expected.length &&
    timingSafeEqual(supplied, expected)
  )
}
