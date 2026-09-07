import { createHash } from 'node:crypto'
import { z } from 'zod'

export function planAudienceBatches(
  input: unknown,
  checkpointInput: unknown
) {
  const identities = z
    .array(z.string().min(1))
    .min(1)
    .parse(input)
  if (new Set(identities).size !== identities.length)
    throw new Error('Duplicate upload identities')
  const datasetHash = createHash('sha256')
    .update(JSON.stringify(identities))
    .digest('hex')
  const checkpoint = z
    .strictObject({
      datasetHash: z.string(),
      acceptedThrough: z.number().int().nonnegative(),
      inFlight: z.number().int().positive().nullable()
    })
    .nullable()
    .parse(checkpointInput)
  if (
    checkpoint?.datasetHash &&
    checkpoint.datasetHash !== datasetHash
  )
    throw new Error('Changed dataset; cannot resume')
  if (
    checkpoint?.inFlight !== null &&
    checkpoint?.inFlight !== undefined
  )
    throw new Error(
      'Upload outcome uncertain; reconcile receipt before resume'
    )
  const count = Math.ceil(identities.length / 9999)
  if ((checkpoint?.acceptedThrough ?? 0) > count)
    throw new Error('Checkpoint exceeds batch count')
  return Array.from({ length: count }, (_, index) => ({
    datasetHash,
    sequence: index + 1,
    offset: index * 9999,
    count: Math.min(9999, identities.length - index * 9999),
    lastBatch: index === count - 1
  })).filter(
    batch => batch.sequence > (checkpoint?.acceptedThrough ?? 0)
  )
}
