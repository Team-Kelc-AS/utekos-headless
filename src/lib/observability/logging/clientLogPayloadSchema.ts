import { z } from 'zod'
import { sanitizeOperationalPathname } from './sanitizeOperationalPathname'
import {
  clientErrorDataSchema,
  type AppLogInput
} from './appLogContract'

export { sanitizeOperationalPathname }

const pathnameSchema = z
  .string()
  .min(1)
  .max(2_048)
  .transform(sanitizeOperationalPathname)

const clientErrorSchema = z.strictObject({
  event: z.literal('client_error'),
  level: z.literal('error'),
  data: clientErrorDataSchema,
  context: z.strictObject({ pathname: pathnameSchema })
})

const unhandledRejectionSchema = z.strictObject({
  event: z.literal('client_unhandled_rejection'),
  level: z.literal('error'),
  data: z.strictObject({
    source: z.literal('unhandled_rejection'),
    errorName: z
      .enum([
        'AbortError',
        'AggregateError',
        'DOMException',
        'Error',
        'EvalError',
        'OtherError',
        'RangeError',
        'ReferenceError',
        'SyntaxError',
        'TimeoutError',
        'TypeError',
        'URIError',
        'ZodError'
      ])
      .optional(),
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
    reasonIsError: z.boolean(),
    sentryEventId: z
      .string()
      .regex(/^[a-f0-9]{32}$/)
      .optional()
  }),
  context: z.strictObject({ pathname: pathnameSchema })
})

const clientHealthProbeSchema = z.strictObject({
  event: z.literal('client_health_probe'),
  level: z.literal('info'),
  data: z.strictObject({ source: z.literal('launch_guard') }),
  context: z.strictObject({
    pathname: z.literal('/skreddersy-varmen')
  })
})

export const clientLogPayloadSchema = z.discriminatedUnion(
  'event',
  [
    clientErrorSchema,
    unhandledRejectionSchema,
    clientHealthProbeSchema
  ]
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

  if (payload.event === 'client_health_probe') {
    return {
      event: 'observability.client_log_health_probe',
      level: 'INFO',
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
