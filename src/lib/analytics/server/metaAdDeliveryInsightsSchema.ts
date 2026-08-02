import { z } from 'zod'

const metaMetricStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d+)?$/)

const metaActionMetricSchema = z
  .object({
    action_type: z.string().trim().min(1).max(160),
    value: metaMetricStringSchema
  })
  .strip()

export const metaAdDeliveryInsightRowSchema = z
  .object({
    account_id: z.string().regex(/^\d+$/),
    actions: z.array(metaActionMetricSchema).nullish(),
    ad_id: z.string().regex(/^\d+$/),
    ad_name: z.string().trim().min(1).max(500).optional(),
    adset_id: z.string().regex(/^\d+$/),
    adset_name: z.string().trim().min(1).max(500).optional(),
    campaign_id: z.string().regex(/^\d+$/),
    campaign_name: z.string().trim().min(1).max(500).optional(),
    clicks: metaMetricStringSchema.nullish(),
    date_start: z.iso.date(),
    date_stop: z.iso.date(),
    device_platform: z.string().trim().min(1).max(160).optional(),
    impression_device: z.string().trim().min(1).max(160).optional(),
    impressions: metaMetricStringSchema.nullish(),
    outbound_clicks: z.array(metaActionMetricSchema).nullish(),
    platform_position: z.string().trim().min(1).max(160).optional(),
    publisher_platform: z.string().trim().min(1).max(160).optional()
  })
  .strip()
  .superRefine((row, context) => {
    if (row.date_start !== row.date_stop) {
      context.addIssue({
        code: 'custom',
        message: 'Meta delivery insight rows must use a one-day grain',
        path: ['date_stop']
      })
    }
  })

export const metaAdDeliveryInsightsResponseSchema = z
  .object({
    data: z.array(metaAdDeliveryInsightRowSchema),
    paging: z
      .object({
        cursors: z
          .object({
            after: z.string().min(1).max(4096).optional()
          })
          .strip()
          .optional()
      })
      .strip()
      .optional()
  })
  .strip()

export const metaAdAccountResponseSchema = z
  .object({
    id: z.string().regex(/^act_\d+$/),
    timezone_name: z.string().trim().min(1).max(120)
  })
  .strip()

export type MetaAdDeliveryInsightRow = z.infer<
  typeof metaAdDeliveryInsightRowSchema
>

export type MetaAdDeliveryInsightsResponse = z.infer<
  typeof metaAdDeliveryInsightsResponseSchema
>
