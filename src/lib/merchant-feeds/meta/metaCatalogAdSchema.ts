import { z } from 'zod'

const numericIdSchema = z.string().regex(/^\d+$/)
const canonicalUtekosUrlSchema = z.url().refine(
  value => new URL(value).origin === 'https://utekos.no',
  'Meta catalog ads must use the canonical public Utekos origin'
)

export const metaCatalogAdInputSchema = z.strictObject({
  adName: z.string().trim().min(1).max(100),
  adSetId: numericIdSchema,
  includeProductVideo: z.boolean().optional().default(false),
  instagramUserId: numericIdSchema.optional(),
  link: canonicalUtekosUrlSchema,
  message: z.string().trim().min(1),
  pageId: numericIdSchema,
  pixelId: numericIdSchema,
  productSetId: numericIdSchema
})

const enrollStatusSchema = z.enum(['OPT_IN', 'OPT_OUT'])

export const metaCatalogAdRequestSchema = z.strictObject({
  name: z.string().min(1).max(100),
  adset_id: numericIdSchema,
  conversion_domain: z.literal('utekos.no'),
  creative: z.strictObject({
    name: z.string().min(1).max(100),
    product_set_id: numericIdSchema,
    object_type: z.literal('SHARE'),
    object_story_spec: z.strictObject({
      page_id: numericIdSchema,
      instagram_user_id: numericIdSchema.optional(),
      template_data: z.strictObject({
        multi_share_end_card: z.literal(true),
        link: canonicalUtekosUrlSchema,
        message: z.string().min(1),
        name: z.literal('{{product.name}}'),
        description: z.literal('{{product.current_price}}'),
        call_to_action: z.strictObject({
          type: z.literal('SHOP_NOW')
        }),
        preferred_image_tags: z.array(z.string().min(1)).min(1)
      })
    }),
    asset_feed_spec: z.strictObject({
      optimization_type: z.literal('FORMAT_AUTOMATION'),
      ad_formats: z.tuple([
        z.literal('CAROUSEL'),
        z.literal('COLLECTION')
      ]),
      descriptions: z.tuple([
        z.strictObject({ text: z.literal('{{product.description}}') })
      ])
    }),
    degrees_of_freedom_spec: z.strictObject({
      creative_features_spec: z.strictObject({
        adapt_to_placement: z.strictObject({
          enroll_status: z.literal('OPT_IN')
        }),
        media_type_automation: z.strictObject({
          enroll_status: enrollStatusSchema
        })
      })
    }),
    url_tags: z.string().min(1)
  }),
  status: z.literal('PAUSED'),
  tracking_specs: z.tuple([
    z.strictObject({
      'action.type': z.literal('offsite_conversion'),
      fb_pixel: numericIdSchema
    })
  ])
})

export type MetaCatalogAdInput = z.input<
  typeof metaCatalogAdInputSchema
>
export type MetaCatalogAdRequest = z.infer<
  typeof metaCatalogAdRequestSchema
>

export const metaCatalogAdSubmissionInputSchema = z.strictObject({
  accessToken: z.string().trim().min(1),
  adAccountId: numericIdSchema,
  mode: z.enum(['validate', 'create']),
  request: metaCatalogAdRequestSchema
})

export const metaCatalogAdSubmissionResponseSchema = z.union([
  z.strictObject({ success: z.literal(true) }),
  z.strictObject({ id: numericIdSchema, success: z.boolean().optional() })
])
