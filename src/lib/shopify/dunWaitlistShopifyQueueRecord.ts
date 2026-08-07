import { z } from 'zod'

/**
 * Postgres bigint may arrive as string | number | bigint depending on the driver.
 * Always normalize to string — never coerce through Number (precision loss).
 */
export const pgmqMsgIdSchema = z
  .union([z.string(), z.number(), z.bigint()])
  .transform((value, context) => {
    const asString =
      typeof value === 'bigint' ? value.toString()
      : typeof value === 'number' ?
        Number.isInteger(value) && Number.isSafeInteger(value) ?
          String(value)
        : null
      : value.trim()

    if (
      asString === null ||
      asString.length === 0 ||
      !/^-?\d+$/.test(asString)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'msg_id must be an integer bigint string'
      })
      return z.NEVER
    }

    return asString
  })

export type PgmqMsgId = z.infer<typeof pgmqMsgIdSchema>

const timestampSchema = z.union([z.date(), z.string().min(1)])

export const dunWaitlistShopifyQueueRecordSchema = z.strictObject({
  msg_id: pgmqMsgIdSchema,
  read_ct: z.coerce.number().int().nonnegative(),
  enqueued_at: timestampSchema,
  vt: timestampSchema,
  message: z.unknown(),
  last_read_at: timestampSchema.nullable().optional(),
  headers: z.unknown().nullable().optional()
})

export type DunWaitlistShopifyQueueRecord = z.infer<
  typeof dunWaitlistShopifyQueueRecordSchema
>

export function toPgmqMsgIdSqlParameter(msgId: string): string {
  return pgmqMsgIdSchema.parse(msgId)
}
