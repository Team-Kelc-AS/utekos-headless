import { z } from 'zod'

export const CAMPAIGN_ATTRIBUTION_KEYS = [
  'campaign_id',
  'campaign_name',
  'adset_id',
  'adset_name',
  'ad_id',
  'ad_name'
] as const

export const campaignAttributionValueSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)

export const campaignAttributionSchema = z
  .strictObject({
    campaign_id: campaignAttributionValueSchema.optional(),
    campaign_name: campaignAttributionValueSchema.optional(),
    adset_id: campaignAttributionValueSchema.optional(),
    adset_name: campaignAttributionValueSchema.optional(),
    ad_id: campaignAttributionValueSchema.optional(),
    ad_name: campaignAttributionValueSchema.optional()
  })
  .refine(
    attribution =>
      CAMPAIGN_ATTRIBUTION_KEYS.some(key => attribution[key]),
    {
      message:
        'Campaign attribution requires at least one value.'
    }
  )

export type CampaignAttribution = z.infer<
  typeof campaignAttributionSchema
>

export function parseCampaignAttribution(
  input: unknown
): CampaignAttribution | undefined {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input)
  ) {
    return undefined
  }

  const candidate: Partial<CampaignAttribution> = {}

  for (const key of CAMPAIGN_ATTRIBUTION_KEYS) {
    const value = (input as Record<string, unknown>)[key]
    const parsed =
      campaignAttributionValueSchema.safeParse(value)
    if (parsed.success) candidate[key] = parsed.data
  }

  const parsed = campaignAttributionSchema.safeParse(candidate)
  return parsed.success ? parsed.data : undefined
}
