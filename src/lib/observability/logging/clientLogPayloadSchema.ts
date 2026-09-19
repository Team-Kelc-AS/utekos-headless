import * as z from '@/lib/validation/zodMini'
import { sanitizeClientErrorMessage } from '@/lib/observability/client/sanitizeClientErrorBeacon'
import { sanitizeOperationalPathname } from './sanitizeOperationalPathname'
import type { AppLogInput } from './appLogContract'
import { clientErrorDataSchema } from './clientErrorDataSchema'
import { consentDiagnosticDataSchema } from './consentDiagnosticDataSchema'

export { sanitizeOperationalPathname }

const pathnameSchema = z.pipe(
  z.string().check(z.minLength(1), z.maxLength(2_048)),
  z.transform(sanitizeOperationalPathname)
)

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
    errorName: z.optional(
      z.enum([
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
    ),
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
    message: z.optional(
      z.string().check(
        z.minLength(1),
        z.maxLength(240),
        z.refine(value => !/\S+@\S+\.\S+/.test(value), {
          message:
            'Unhandled rejection message must not contain email-like values'
        })
      )
    )
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
    z.strictObject({
      event: z.literal('consent_diagnostic'),
      level: z.literal('info'),
      data: consentDiagnosticDataSchema,
      context: z.strictObject({ pathname: pathnameSchema })
    }),
    clientHealthProbeSchema
  ]
)

export type ClientLogPayload = z.infer<
  typeof clientLogPayloadSchema
>

export function toAppLogInput(
  payload: ClientLogPayload
): AppLogInput {
  if (payload.event === 'consent_diagnostic') {
    return {
      event: 'consent.diagnostic',
      level: 'INFO',
      data: payload.data,
      context: { route: payload.context.pathname }
    }
  }
  if (payload.event === 'client_error') {
    return {
      event: 'client.error',
      level: 'ERROR',
      data: {
        ...payload.data,
        ...(payload.data.message ?
          {
            message: sanitizeClientErrorMessage(
              payload.data.message
            )
          }
        : {})
      },
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
    data: {
      ...payload.data,
      ...(payload.data.message ?
        {
          message: sanitizeClientErrorMessage(
            payload.data.message
          )
        }
      : {})
    },
    context: { route: payload.context.pathname }
  }
}
