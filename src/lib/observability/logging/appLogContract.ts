import { z } from 'zod'

const emptyDataSchema = z.strictObject({})
const failureReasonSchema = z.enum([
  'configuration',
  'network',
  'provider_rejected',
  'unknown'
])

const eventSchemas = [
  z.strictObject({
    event: z.literal('client.error'),
    level: z.literal('ERROR'),
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
    context: z.strictObject({
      route: z.string().min(1).max(160)
    })
  }),
  z.strictObject({
    event: z.literal('client.unhandled_rejection'),
    level: z.literal('ERROR'),
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
    context: z.strictObject({
      route: z.string().min(1).max(160)
    })
  }),
  z.strictObject({
    event: z.literal('contact.send_failed'),
    level: z.literal('ERROR'),
    data: z.strictObject({ reasonCode: failureReasonSchema }),
    context: emptyDataSchema
  }),
  z.strictObject({
    event: z.literal('contact.submitted'),
    level: z.literal('INFO'),
    data: z.strictObject({ delivery: z.literal('resend') }),
    context: emptyDataSchema
  }),
  z.strictObject({
    event: z.literal('contact.exception'),
    level: z.literal('ERROR'),
    data: z.strictObject({ reasonCode: failureReasonSchema }),
    context: emptyDataSchema
  }),
  z.strictObject({
    event: z.literal('contact.atlas_skipped'),
    level: z.literal('INFO'),
    data: z.strictObject({
      reasonCode: z.enum(['disabled', 'missing_configuration'])
    }),
    context: emptyDataSchema
  }),
  z.strictObject({
    event: z.literal('contact.atlas_failed'),
    level: z.literal('ERROR'),
    data: z.strictObject({
      statusCode: z.number().int().min(400).max(599)
    }),
    context: emptyDataSchema
  }),
  z.strictObject({
    event: z.literal('contact.atlas_forwarded'),
    level: z.literal('INFO'),
    data: emptyDataSchema,
    context: emptyDataSchema
  }),
  z.strictObject({
    event: z.literal('contact.atlas_exception'),
    level: z.literal('ERROR'),
    data: z.strictObject({ reasonCode: z.literal('network') }),
    context: emptyDataSchema
  }),
  z.strictObject({
    event: z.literal('waitlist.submitted'),
    level: z.literal('INFO'),
    data: z.strictObject({
      productHandle: z.string().min(1).max(120)
    }),
    context: emptyDataSchema
  }),
  z.strictObject({
    event: z.literal('waitlist.send_failed'),
    level: z.literal('ERROR'),
    data: z.strictObject({
      reasonCode: failureReasonSchema,
      productHandle: z.string().min(1).max(120)
    }),
    context: emptyDataSchema
  }),
  z.strictObject({
    event: z.literal('newsletter.shopify_sync_failed'),
    level: z.literal('ERROR'),
    data: z.strictObject({ reasonCode: failureReasonSchema }),
    context: emptyDataSchema
  }),
  z.strictObject({
    event: z.literal('newsletter.welcome_email_failed'),
    level: z.literal('ERROR'),
    data: z.strictObject({ reasonCode: failureReasonSchema }),
    context: emptyDataSchema
  }),
  z.strictObject({
    event: z.literal('newsletter.completed'),
    level: z.literal('INFO'),
    data: emptyDataSchema,
    context: emptyDataSchema
  }),
  z.strictObject({
    event: z.literal('newsletter.exception'),
    level: z.literal('ERROR'),
    data: z.strictObject({ reasonCode: failureReasonSchema }),
    context: emptyDataSchema
  }),
  z.strictObject({
    event: z.literal('lead.persist_failed'),
    level: z.literal('ERROR'),
    data: z.strictObject({
      reasonCode: failureReasonSchema,
      formId: z.string().min(1).max(120)
    }),
    context: emptyDataSchema
  }),
  z.strictObject({
    event: z.literal('lead.record_skipped'),
    level: z.literal('ERROR'),
    data: z.strictObject({
      reasonCode: z.literal('missing_page_url'),
      formId: z.string().min(1).max(120)
    }),
    context: emptyDataSchema
  }),
  z.strictObject({
    event: z.literal('lead.record_failed'),
    level: z.literal('ERROR'),
    data: z.strictObject({
      reasonCode: failureReasonSchema,
      formId: z.string().min(1).max(120)
    }),
    context: emptyDataSchema
  }),
  z.strictObject({
    event: z.literal('klarna.notification_received'),
    level: z.literal('INFO'),
    data: z.strictObject({
      hasOrderId: z.boolean(),
      bodyShape: z.enum(['array', 'null', 'object', 'primitive'])
    }),
    context: emptyDataSchema
  })
] as const

export const appLogInputSchema = z.discriminatedUnion(
  'event',
  eventSchemas
)

export type AppLogInput = z.infer<typeof appLogInputSchema>

export function classifyOperationalFailure(
  error: unknown
): z.infer<typeof failureReasonSchema> {
  const message =
    error instanceof Error ? error.message : String(error)

  if (
    message.includes('CONTACT_FORM_SEND_TO_EMAIL') ||
    message.includes('Invalid Resend email configuration') ||
    message.includes('Missing SHOPIFY')
  ) {
    return 'configuration'
  }

  if (
    error instanceof TypeError ||
    /fetch|network|timeout|ECONN|ENOTFOUND/i.test(message)
  ) {
    return 'network'
  }

  return message ? 'provider_rejected' : 'unknown'
}
