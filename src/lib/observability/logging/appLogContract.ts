import { z } from 'zod'
import { requiredMetaDatasetQualityEvents } from '@/lib/analytics/metaDatasetQualityRequiredEvents'
import { sanitizeOperationalPathname } from './sanitizeOperationalPathname'

const emptyDataSchema = z.strictObject({})
const failureReasonSchema = z.enum([
  'configuration',
  'network',
  'provider_rejected',
  'unknown'
])

const commerceEventStatusSchema = z.enum([
  'accepted',
  'duplicate'
])
const checkoutMethodSchema = z.enum([
  'shopify_checkout',
  'klarna_express'
])
const durationMsSchema = z
  .number()
  .int()
  .nonnegative()
  .max(300_000)
const commerceEventDataBase = {
  currency: z.string().regex(/^[A-Z]{3}$/),
  durationMs: durationMsSchema,
  eventId: z.string().uuid(),
  grossValue: z.number().finite().nonnegative(),
  itemCount: z.number().int().positive().max(250),
  quantity: z.number().int().positive().max(10_000),
  status: commerceEventStatusSchema
}
const commerceEventDataSchema = z.discriminatedUnion(
  'eventName',
  [
    z.strictObject({
      eventName: z.literal('add_to_cart'),
      ...commerceEventDataBase
    }),
    z.strictObject({
      checkoutMethod: checkoutMethodSchema,
      eventName: z.literal('begin_checkout'),
      ...commerceEventDataBase
    })
  ]
)
const commerceEventContextSchema = z.strictObject({
  pagePath: z
    .string()
    .min(1)
    .max(2_048)
    .transform(sanitizeOperationalPathname),
  requestPath: z.enum([
    '/api/events/add-to-cart',
    '/api/events/begin-checkout'
  ]),
  vercelId: z.string().min(1).max(256).optional()
})
const klarnaCheckoutStageSchema = z.enum([
  'order_request_received',
  'order_created',
  'order_creation_failed'
])

export const metaDatasetQualityIncompleteDataSchema = z.strictObject({
  datasetId: z.string().regex(/^\d{1,32}$/),
  missingRequiredEvents: z
    .array(z.enum(requiredMetaDatasetQualityEvents))
    .min(1)
    .max(6),
  snapshotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})

const eventSchemas = [
  z.strictObject({
    event: z.literal('meta_dataset_quality.incomplete'),
    level: z.literal('WARN'),
    data: metaDatasetQualityIncompleteDataSchema,
    context: emptyDataSchema
  }),
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
      productHandle: z.string().min(1).max(120),
      marketingOptIn: z.boolean().optional(),
      entryPoint: z
        .enum(['product_page', 'product_card'])
        .optional()
    }),
    context: emptyDataSchema
  }),
  z.strictObject({
    event: z.literal('waitlist.send_failed'),
    level: z.literal('ERROR'),
    data: z.strictObject({
      reasonCode: failureReasonSchema,
      productHandle: z.string().min(1).max(120),
      entryPoint: z
        .enum(['product_page', 'product_card'])
        .optional()
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
    event: z.literal('commerce.event'),
    level: z.literal('INFO'),
    data: commerceEventDataSchema,
    context: commerceEventContextSchema
  }),
  z.strictObject({
    event: z.literal('commerce.klarna_checkout'),
    level: z.literal('INFO'),
    data: z.strictObject({
      durationMs: durationMsSchema,
      stage: klarnaCheckoutStageSchema
    }),
    context: z.strictObject({
      requestPath: z.literal('/api/klarna/orders'),
      vercelId: z.string().min(1).max(256).optional()
    })
  }),
  z.strictObject({
    event: z.literal('commerce.purchase_notification_sent'),
    level: z.literal('INFO'),
    data: z.strictObject({
      delivery: z.enum(['already_sent', 'sent']),
      eventId: z.string().uuid()
    }),
    context: z.strictObject({
      requestPath: z.literal(
        '/api/shopify/webhooks/orders-paid'
      )
    })
  }),
  z.strictObject({
    event: z.literal('commerce.purchase_notification_failed'),
    level: z.literal('ERROR'),
    data: z.strictObject({
      eventId: z.string().uuid(),
      reasonCode: z.enum(['configuration', 'provider_rejected'])
    }),
    context: z.strictObject({
      requestPath: z.literal(
        '/api/shopify/webhooks/orders-paid'
      )
    })
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
