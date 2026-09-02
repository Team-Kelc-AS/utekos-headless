import { z } from 'zod'
import { metaCustomerSegmentationSchema } from './metaCustomerSegmentation'

export const metaNonEmptyStringSchema = z
  .string()
  .trim()
  .min(1)
  .max(4096)
export const metaIdentifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(512)
export const metaUnixSecondsSchema = z.number().int().positive()
export const metaSha256Schema = z
  .string()
  .regex(/^[a-f0-9]{64}$/)
const extInfoValue = z.union([
  z.string().max(4096),
  z.number().finite()
])

export const metaExtInfoSchema = z
  .tuple([
    z.enum(['i2', 'a2']),
    extInfoValue,
    extInfoValue,
    extInfoValue,
    metaNonEmptyStringSchema,
    extInfoValue,
    extInfoValue,
    extInfoValue,
    extInfoValue,
    extInfoValue,
    extInfoValue,
    extInfoValue,
    extInfoValue,
    extInfoValue,
    extInfoValue,
    extInfoValue
  ])
  .readonly()

const metaJsonPrimitiveSchema = z.union([
  z.string().max(4096),
  z.number().finite(),
  z.boolean(),
  z.null()
])

type MetaJsonValue =
  | string
  | number
  | boolean
  | null
  | MetaJsonValue[]
  | { [key: string]: MetaJsonValue }

const metaJsonValueSchema: z.ZodType<MetaJsonValue> = z.lazy(
  () =>
    z.union([
      metaJsonPrimitiveSchema,
      z.array(metaJsonValueSchema).max(100),
      z.record(z.string().min(1).max(100), metaJsonValueSchema)
    ])
)

const metaCommerceContentSchema = z.strictObject({
  brand: metaNonEmptyStringSchema.optional(),
  category: metaNonEmptyStringSchema.optional(),
  id: metaIdentifierSchema,
  item_price: z.number().finite().nonnegative().optional(),
  quantity: z.number().int().positive(),
  title: metaNonEmptyStringSchema.optional()
})

const metaCustomDataSchema = z
  .object({
    content_ids: z
      .array(metaIdentifierSchema)
      .min(1)
      .max(100)
      .optional(),
    content_type: z
      .enum(['product', 'product_group'])
      .optional(),
    contents: z
      .array(metaCommerceContentSchema)
      .min(1)
      .max(100)
      .optional(),
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/u)
      .optional(),
    customer_segmentation:
      metaCustomerSegmentationSchema.optional(),
    order_id: metaIdentifierSchema.optional(),
    value: z.number().finite().nonnegative().optional()
  })
  .catchall(metaJsonValueSchema)

const originalEventDataSchema = z
  .strictObject({
    event_id: metaIdentifierSchema.optional(),
    event_name: metaNonEmptyStringSchema,
    event_time: metaUnixSecondsSchema,
    order_id: metaIdentifierSchema.optional()
  })
  .refine(data => data.event_id || data.order_id, {
    message: 'Original event data needs event_id or order_id'
  })

export const metaObservedUserDataShape = {
  client_ip_address: metaNonEmptyStringSchema.optional(),
  client_user_agent: metaNonEmptyStringSchema.optional(),
  email_sha256: z
    .array(metaSha256Schema)
    .min(1)
    .max(10)
    .optional(),
  external_id: metaIdentifierSchema.optional(),
  fb_login_id: z.string().regex(/^\d+$/u).max(64).optional(),
  fbc: metaNonEmptyStringSchema.optional(),
  fbp: metaNonEmptyStringSchema.optional(),
  phone_sha256: z
    .array(metaSha256Schema)
    .min(1)
    .max(10)
    .optional()
} as const

export const metaAppDataSchema = z.strictObject({
  application_tracking_enabled: z.boolean(),
  campaign_ids: metaNonEmptyStringSchema.optional(),
  consider_views: z.boolean().optional(),
  extinfo: metaExtInfoSchema,
  include_dwell_data: z.boolean().optional(),
  include_video_data: z.boolean().optional(),
  install_referrer: metaNonEmptyStringSchema.optional(),
  installer_package: metaNonEmptyStringSchema.optional(),
  receipt_data: metaNonEmptyStringSchema.optional(),
  url_schemes: z
    .array(
      z
        .string()
        .regex(/^[a-z][a-z0-9+.-]*:\/\//iu)
        .max(2048)
    )
    .min(1)
    .max(20)
    .optional(),
  vendor_id: metaIdentifierSchema.optional(),
  windows_attribution_id: metaIdentifierSchema.optional()
})

export const metaAppEventSchema = z
  .strictObject({
    advertiser_tracking_enabled: z.boolean(),
    app_data: metaAppDataSchema,
    custom_data: metaCustomDataSchema.optional(),
    event_id: metaIdentifierSchema,
    event_name: metaNonEmptyStringSchema,
    event_time: metaUnixSecondsSchema,
    opt_out: z.boolean().optional(),
    original_event_data: originalEventDataSchema.optional(),
    user_data: z.strictObject({
      ...metaObservedUserDataShape,
      anon_id: metaIdentifierSchema.optional(),
      app_user_id: metaIdentifierSchema.optional(),
      madid: metaIdentifierSchema.optional()
    })
  })
  .superRefine((event, context) => {
    if (event.event_name !== 'Purchase') return

    const customData = event.custom_data
    const requiredPurchaseFields = [
      ['currency', customData?.currency],
      ['order_id', customData?.order_id],
      ['value', customData?.value],
      ['content_ids', customData?.content_ids],
      ['contents', customData?.contents]
    ] as const

    for (const [field, value] of requiredPurchaseFields) {
      if (value !== undefined) continue
      context.addIssue({
        code: 'custom',
        message: `App Purchase requires custom_data.${field}`,
        path: ['custom_data', field]
      })
    }
  })

const metaSha256ListSchema = z
  .array(metaSha256Schema)
  .min(1)
  .max(10)

const metaOfflineCustomDataSchema = z
  .object({
    content_ids: z
      .array(metaIdentifierSchema)
      .min(1)
      .max(100)
      .optional(),
    content_type: z
      .enum(['product', 'product_group'])
      .optional(),
    contents: z
      .array(metaCommerceContentSchema)
      .min(1)
      .max(100)
      .optional(),
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/u)
      .optional(),
    customer_segmentation:
      metaCustomerSegmentationSchema.optional(),
    order_id: metaIdentifierSchema.optional(),
    value: z.number().finite().nonnegative().optional()
  })
  .catchall(metaJsonValueSchema)

const metaOfflineUserDataSchema = z
  .strictObject({
    ...metaObservedUserDataShape,
    city_sha256: metaSha256ListSchema.optional(),
    country_sha256: metaSha256ListSchema.optional(),
    date_of_birth_sha256: metaSha256ListSchema.optional(),
    first_name_sha256: metaSha256ListSchema.optional(),
    gender_sha256: metaSha256ListSchema.optional(),
    last_name_sha256: metaSha256ListSchema.optional(),
    lead_id: metaIdentifierSchema.optional(),
    madid: metaIdentifierSchema.optional(),
    postal_code_sha256: metaSha256ListSchema.optional(),
    state_sha256: metaSha256ListSchema.optional()
  })
  .refine(
    data =>
      Boolean(
        data.email_sha256 ||
        data.phone_sha256 ||
        data.external_id ||
        data.fb_login_id ||
        data.city_sha256 ||
        data.country_sha256 ||
        data.date_of_birth_sha256 ||
        data.first_name_sha256 ||
        data.gender_sha256 ||
        data.last_name_sha256 ||
        data.lead_id ||
        data.madid ||
        data.postal_code_sha256 ||
        data.state_sha256
      ),
    {
      message:
        'Offline events need at least one observed customer match key'
    }
  )

export const metaOfflineEventSchema = z
  .strictObject({
    custom_data: metaOfflineCustomDataSchema.optional(),
    event_id: metaIdentifierSchema,
    event_name: metaNonEmptyStringSchema,
    event_time: metaUnixSecondsSchema,
    opt_out: z.boolean().optional(),
    original_event_data: originalEventDataSchema.optional(),
    user_data: metaOfflineUserDataSchema
  })
  .superRefine((event, context) => {
    if (event.event_name !== 'Purchase') return

    const customData = event.custom_data
    const requiredPurchaseFields = [
      ['currency', customData?.currency],
      ['order_id', customData?.order_id],
      ['value', customData?.value],
      ['content_ids', customData?.content_ids],
      ['contents', customData?.contents]
    ] as const

    for (const [field, value] of requiredPurchaseFields) {
      if (value !== undefined) continue
      context.addIssue({
        code: 'custom',
        message: `Offline Purchase requires custom_data.${field}`,
        path: ['custom_data', field]
      })
    }
  })

const metaBusinessMessagingBaseSchema = z.strictObject({
  custom_data: metaCustomDataSchema.optional(),
  event_id: metaIdentifierSchema,
  event_name: metaNonEmptyStringSchema,
  event_time: metaUnixSecondsSchema,
  opt_out: z.boolean().optional(),
  original_event_data: originalEventDataSchema.optional()
})

const whatsappEventSchema =
  metaBusinessMessagingBaseSchema.extend({
    messaging_channel: z.literal('whatsapp'),
    user_data: z.strictObject({
      ...metaObservedUserDataShape,
      ctwa_clid: metaIdentifierSchema,
      whatsapp_business_account_id: metaIdentifierSchema
    })
  })

const messengerEventSchema =
  metaBusinessMessagingBaseSchema.extend({
    messaging_channel: z.literal('messenger'),
    user_data: z.strictObject({
      ...metaObservedUserDataShape,
      page_id: metaIdentifierSchema,
      page_scoped_user_id: metaIdentifierSchema
    })
  })

const instagramEventSchema =
  metaBusinessMessagingBaseSchema.extend({
    messaging_channel: z.literal('instagram'),
    user_data: z.strictObject({
      ...metaObservedUserDataShape,
      ig_account_id: metaIdentifierSchema,
      ig_sid: metaIdentifierSchema
    })
  })

export const metaBusinessMessagingEventSchema =
  z.discriminatedUnion('messaging_channel', [
    whatsappEventSchema,
    messengerEventSchema,
    instagramEventSchema
  ])

export type MetaAppEvent = z.infer<typeof metaAppEventSchema>
export type MetaAppData = z.infer<typeof metaAppDataSchema>
export type MetaOfflineEvent = z.infer<
  typeof metaOfflineEventSchema
>
export type MetaBusinessMessagingEvent = z.infer<
  typeof metaBusinessMessagingEventSchema
>
