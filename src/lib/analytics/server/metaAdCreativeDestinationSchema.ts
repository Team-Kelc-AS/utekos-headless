import { z } from 'zod'

const idSchema = z.string().regex(/^\d+$/)
const boundedStringSchema = z.string().trim().min(1).max(8192)
const metaTimestampSchema = z
  .string()
  .refine(
    value => Number.isFinite(Date.parse(value)),
    'Meta returned an invalid timestamp'
  )

const metaAdCreativeReferenceSchema = z
  .object({ id: idSchema })
  .strip()

export const metaAdCreativeAccountAdSchema = z
  .object({
    created_time: metaTimestampSchema,
    creative: metaAdCreativeReferenceSchema,
    effective_status: z.string().trim().min(1).max(120),
    id: idSchema,
    updated_time: metaTimestampSchema
  })
  .strip()

const pagingSchema = z
  .object({
    cursors: z
      .object({ after: z.string().min(1).max(4096).optional() })
      .strip()
      .optional()
  })
  .strip()
  .optional()

export const metaAdCreativeAccountAdsResponseSchema = z
  .object({
    data: z.array(metaAdCreativeAccountAdSchema),
    paging: pagingSchema
  })
  .strip()

const linkUrlSchema = z
  .object({ website_url: boundedStringSchema.optional() })
  .strip()

const callToActionSchema = z
  .object({
    value: z
      .object({ link: boundedStringSchema.optional() })
      .strip()
      .optional()
  })
  .strip()

const storyDataSchema = z
  .object({
    call_to_action: callToActionSchema.optional(),
    link: boundedStringSchema.optional()
  })
  .strip()

export const metaAdCreativeResponseSchema = z
  .object({
    asset_feed_spec: z
      .object({ link_urls: z.array(linkUrlSchema).optional() })
      .strip()
      .nullish(),
    effective_object_story_id: boundedStringSchema.nullish(),
    id: idSchema,
    object_story_spec: z
      .object({
        link_data: storyDataSchema.optional(),
        template_data: storyDataSchema.optional(),
        video_data: storyDataSchema.optional()
      })
      .strip()
      .nullish(),
    object_url: boundedStringSchema.nullish(),
    product_set_id: idSchema.nullish(),
    template_url_spec: z
      .object({
        web: z
          .object({ url: boundedStringSchema.optional() })
          .strip()
          .optional()
      })
      .strip()
      .nullish(),
    url_tags: z.string().trim().max(8192).nullish()
  })
  .strip()

export type MetaAdCreativeAccountAd = z.infer<
  typeof metaAdCreativeAccountAdSchema
>
export type MetaAdCreativeResponse = z.infer<
  typeof metaAdCreativeResponseSchema
>
