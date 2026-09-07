import { createHash } from 'node:crypto'
import { z } from 'zod'
import { planAudienceBatches } from './planAudienceBatches'

const checkpointSchema = z.strictObject({
  datasetHash: z.string(),
  contractHash: z.string(),
  acceptedThrough: z.number().int().nonnegative(),
  inFlight: z.number().int().positive().nullable(),
  sessionId: z
    .number()
    .int()
    .positive()
    .max(Number.MAX_SAFE_INTEGER)
})
export type AudienceUploadCheckpoint = z.infer<
  typeof checkpointSchema
>

export async function uploadAudienceBatches(
  input: unknown,
  dependencies: {
    accessToken: string
    saveCheckpoint: (
      checkpoint: AudienceUploadCheckpoint
    ) => Promise<void>
    fetcher?: typeof fetch
  }
) {
  const request = z
    .strictObject({
      audienceId: z.string().regex(/^\d+$/),
      accountId: z.string().regex(/^\d+$/),
      permissionEvidence: z.string().min(1),
      authorized: z.literal(true),
      schema: z
        .array(z.enum(['PHONE', 'EMAIL']))
        .min(1)
        .max(2),
      data: z
        .array(z.array(z.string().regex(/^$|^[a-f0-9]{64}$/)))
        .min(1),
      checkpoint: checkpointSchema.nullable(),
      sessionId: z
        .number()
        .int()
        .positive()
        .max(Number.MAX_SAFE_INTEGER)
    })
    .parse(input)
  if (
    new Set(request.schema).size !== request.schema.length ||
    request.data.some(
      row =>
        row.length !== request.schema.length ||
        row.every(cell => !cell)
    )
  )
    throw new Error('Invalid upload schema or row')
  const contractHash = createHash('sha256')
    .update(
      JSON.stringify([
        request.accountId,
        request.audienceId,
        request.schema,
        request.permissionEvidence,
        request.sessionId
      ])
    )
    .digest('hex')
  if (
    request.checkpoint &&
    (request.checkpoint.contractHash !== contractHash ||
      request.checkpoint.sessionId !== request.sessionId)
  )
    throw new Error('Changed upload contract; cannot resume')
  const plan = planAudienceBatches(
    request.data.map(row => JSON.stringify(row)),
    request.checkpoint ?
      {
        datasetHash: request.checkpoint.datasetHash,
        acceptedThrough: request.checkpoint.acceptedThrough,
        inFlight: request.checkpoint.inFlight
      }
    : null
  )
  let checkpoint = request.checkpoint
  const receipts: Array<{
    audienceId: string
    sequence: number
    received: number
    invalid: number
  }> = []
  for (const batch of plan) {
    checkpoint = {
      contractHash,
      datasetHash: batch.datasetHash,
      acceptedThrough: checkpoint?.acceptedThrough ?? 0,
      inFlight: batch.sequence,
      sessionId: request.sessionId
    }
    await dependencies.saveCheckpoint(checkpoint)
    const response = await (dependencies.fetcher ?? fetch)(
      `https://graph.facebook.com/v26.0/${request.audienceId}/users`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dependencies.accessToken}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({
          session: {
            session_id: request.sessionId,
            batch_seq: batch.sequence,
            last_batch_flag: batch.lastBatch,
            estimated_num_total: request.data.length
          },
          payload: {
            schema: request.schema,
            data: request.data.slice(
              batch.offset,
              batch.offset + batch.count
            )
          }
        })
      }
    )
    const receipt = z
      .object({
        audience_id: z.string(),
        session_id: z.number(),
        num_received: z.number().int().nonnegative(),
        num_invalid_entries: z.number().int().nonnegative()
      })
      .safeParse(await response.json())
    if (
      !response.ok ||
      !receipt.success ||
      receipt.data.audience_id !== request.audienceId ||
      receipt.data.session_id !== request.sessionId ||
      receipt.data.num_invalid_entries > 0 ||
      receipt.data.num_received < batch.count
    )
      throw new Error(
        `Batch ${batch.sequence} requires receipt reconciliation; no automatic retry`
      )
    receipts.push({
      audienceId: receipt.data.audience_id,
      sequence: batch.sequence,
      received: receipt.data.num_received,
      invalid: receipt.data.num_invalid_entries
    })
    checkpoint = {
      ...checkpoint,
      acceptedThrough: batch.sequence,
      inFlight: null
    }
    await dependencies.saveCheckpoint(checkpoint)
  }
  return {
    checkpoint,
    receipts,
    processingVerified: false,
    matchingVerified: false,
    deliveryVerified: false
  }
}
