import { z } from 'zod'
import { sanitizeOperationalPathname } from './sanitizeOperationalPathname'
import type { AppLogInput } from './appLogContract'

export { sanitizeOperationalPathname }

const pathnameSchema = z
  .string()
  .min(1)
  .max(2_048)
  .transform(sanitizeOperationalPathname)

const clientErrorSchema = z.strictObject({
  event: z.literal('client_error'),
  level: z.literal('error'),
  data: z.strictObject({
    source: z.literal('window_error'),
    line: z
      .number()
      .int()
      .nonnegative()
      .max(10_000_000)
      .optional(),
    column: z
      .number()
      .int()
      .nonnegative()
      .max(10_000_000)
      .optional()
  }),
  context: z.strictObject({ pathname: pathnameSchema })
})

const unhandledRejectionSchema = z.strictObject({
  event: z.literal('client_unhandled_rejection'),
  level: z.literal('error'),
  data: z.strictObject({
    source: z.literal('unhandled_rejection'),
    reasonType: z.enum([
      'bigint',
      'boolean',
      'function',
      'null',
      'number',
      'object',
      'string',
      'symbol',
      'undefined'
    ]),
    reasonIsError: z.boolean()
  }),
  context: z.strictObject({ pathname: pathnameSchema })
})

export const clientLogPayloadSchema = z.discriminatedUnion(
  'event',
  [clientErrorSchema, unhandledRejectionSchema]
)

export function toAppLogInput(
  payload: z.infer<typeof clientLogPayloadSchema>
): AppLogInput {
  if (payload.event === 'client_error') {
    return {
      event: 'client.error',
      level: 'ERROR',
      data: payload.data,
      context: { route: payload.context.pathname }
    }
  }

  return {
    event: 'client.unhandled_rejection',
    level: 'ERROR',
    data: payload.data,
    context: { route: payload.context.pathname }
  }
}
