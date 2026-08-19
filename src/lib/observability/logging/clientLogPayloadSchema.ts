import { z } from 'zod'
import { sanitizeOperationalPathname } from './sanitizeOperationalPathname'
import type { AppLogInput } from './appLogContract'

export { sanitizeOperationalPathname }

const pathnameSchema = z
  .string()
  .min(1)
  .max(2_048)
  .transform(sanitizeOperationalPathname)

const clientErrorMessageSchema = z
  .string()
  .min(1)
  .max(240)
  .refine(value => !/\S+@\S+\.\S+/.test(value), {
    message: 'Client error message must not contain email-like values'
  })

const clientErrorFilenameSchema = z
  .string()
  .min(1)
  .max(512)
  .transform(sanitizeOperationalPathname)

const clientErrorSchema = z.strictObject({
  event: z.literal('client_error'),
  level: z.literal('error'),
  data: z.strictObject({
    source: z.literal('window_error'),
    message: clientErrorMessageSchema.optional(),
    filename: clientErrorFilenameSchema.optional(),
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

export type ClientLogPayload = z.infer<typeof clientLogPayloadSchema>

export function toAppLogInput(
  payload: ClientLogPayload
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
