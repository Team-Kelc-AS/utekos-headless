import { z } from 'zod'
import {
  metaAppDataSchema,
  metaIdentifierSchema,
  metaNonEmptyStringSchema,
  metaObservedUserDataShape,
  metaUnixSecondsSchema
} from './metaNonWebEventContract'

export const META_APPEND_ATTRIBUTION_MAX_DELAY_SECONDS =
  48 * 60 * 60

const metaAdIdSchema = z.string().regex(/^\d+$/u).max(64)
const metaCurrencySchema = z.string().regex(/^[A-Z]{3}$/u)

const metaAppendAttributionDataSchema = z.strictObject({
  ad_id: metaAdIdSchema,
  attribution_share: z.number().finite().min(0).max(1),
  touchpoint_ts: metaUnixSecondsSchema
})

const commonAppendAttributionShape = {
  attribution_data: metaAppendAttributionDataSchema,
  conversion_value: z.number().finite().nonnegative(),
  custom_data: z.strictObject({
    currency: metaCurrencySchema
  }),
  event_id: metaIdentifierSchema,
  event_name: z.literal('AppendAttribution'),
  event_time: metaUnixSecondsSchema,
  marketing_consent: z.literal('granted'),
  opt_out: z.boolean().optional()
} as const

const commonAppendUserDataShape = {
  ...metaObservedUserDataShape
} as const

const metaWebAppendAttributionSchema = z.strictObject({
  ...commonAppendAttributionShape,
  action_source: z.literal('website'),
  event_source_url: z.string().url().max(4096),
  original_event_data: z.strictObject({
    event_name: z.literal('Purchase'),
    event_time: metaUnixSecondsSchema,
    order_id: metaIdentifierSchema.optional()
  }),
  referrer_url: z.string().url().max(4096).optional(),
  user_data: z.strictObject({
    ...commonAppendUserDataShape,
    client_user_agent: metaNonEmptyStringSchema
  })
})

const metaAppAppendAttributionSchema = z.strictObject({
  ...commonAppendAttributionShape,
  action_source: z.literal('app'),
  advertiser_tracking_enabled: z.boolean(),
  app_data: metaAppDataSchema,
  original_event_data: z.strictObject({
    event_name: z.literal('fb_mobile_purchase'),
    event_time: metaUnixSecondsSchema,
    order_id: metaIdentifierSchema.optional()
  }),
  user_data: z.strictObject({
    ...commonAppendUserDataShape,
    anon_id: metaIdentifierSchema.optional(),
    app_user_id: metaIdentifierSchema.optional(),
    madid: metaIdentifierSchema.optional()
  })
})

export const metaAppendAttributionEventSchema = z
  .discriminatedUnion('action_source', [
    metaWebAppendAttributionSchema,
    metaAppAppendAttributionSchema
  ])
  .superRefine((event, context) => {
    const originalEventTime =
      event.original_event_data.event_time

    if (
      event.attribution_data.touchpoint_ts >= originalEventTime
    ) {
      context.addIssue({
        code: 'custom',
        message:
          'Meta attribution touchpoint must precede the original event',
        path: ['attribution_data', 'touchpoint_ts']
      })
    }

    if (event.event_time < originalEventTime) {
      context.addIssue({
        code: 'custom',
        message:
          'AppendAttribution event_time cannot precede the original event',
        path: ['event_time']
      })
    }

    if (
      event.event_time - originalEventTime >
      META_APPEND_ATTRIBUTION_MAX_DELAY_SECONDS
    ) {
      context.addIssue({
        code: 'custom',
        message:
          'AppendAttribution must be generated within 48 hours of the original event',
        path: ['event_time']
      })
    }

    if (event.action_source !== 'app') return

    const platform = event.app_data.extinfo[0]
    if (platform === 'i2' && !event.app_data.campaign_ids) {
      context.addIssue({
        code: 'custom',
        message:
          'campaign_ids is required for iOS AppendAttribution events',
        path: ['app_data', 'campaign_ids']
      })
    }
    if (platform === 'a2' && !event.user_data.madid) {
      context.addIssue({
        code: 'custom',
        message:
          'madid is required for Android AppendAttribution events',
        path: ['user_data', 'madid']
      })
    }
  })

export type MetaAppendAttributionEvent = z.infer<
  typeof metaAppendAttributionEventSchema
>

export function getObservedMetaFbcCreationTimestamp(
  fbc: string
): number | undefined {
  const parts = fbc.split('.')
  if (
    parts.length < 4 ||
    parts[0] !== 'fb' ||
    !/^\d+$/u.test(parts[1] ?? '') ||
    !/^\d{13}$/u.test(parts[2] ?? '') ||
    !(parts[3]?.length)
  ) {
    return undefined
  }

  const creationTimeMilliseconds = Number(parts[2])
  if (!Number.isSafeInteger(creationTimeMilliseconds)) {
    return undefined
  }

  const creationTimeSeconds = Math.floor(
    creationTimeMilliseconds / 1000
  )
  const parsed = metaUnixSecondsSchema.safeParse(
    creationTimeSeconds
  )

  return parsed.success ? parsed.data : undefined
}

export function assertMetaAppendAttributionIsSendable(
  rawEvent: MetaAppendAttributionEvent,
  nowUnixSeconds = Math.floor(Date.now() / 1000)
): MetaAppendAttributionEvent {
  const event = metaAppendAttributionEventSchema.parse(rawEvent)
  const originalEventTime =
    event.original_event_data.event_time

  if (event.event_time > nowUnixSeconds) {
    throw new Error(
      'AppendAttribution event_time cannot be in the future'
    )
  }
  if (
    nowUnixSeconds - originalEventTime >
    META_APPEND_ATTRIBUTION_MAX_DELAY_SECONDS
  ) {
    throw new Error(
      'AppendAttribution send window has exceeded 48 hours'
    )
  }

  return event
}
