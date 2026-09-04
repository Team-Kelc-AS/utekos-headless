import { z } from 'zod'

const httpsUrlSchema = z
  .url()
  .refine(value => new URL(value).protocol === 'https:')

const publicProductUrlSchema = httpsUrlSchema.refine(
  value => new URL(value).hostname === 'utekos.no'
)

const mediaAssetSchema = z.strictObject({
  url: httpsUrlSchema,
  tag: z.array(z.string().min(1).max(110)).max(20)
})

const shippingSchema = z.strictObject({
  shipping_country: z.literal('NO'),
  shipping_region: z.literal(''),
  shipping_service: z.literal('1-4 days'),
  shipping_price_value: z.string().regex(/^\d+\.\d{2}$/),
  shipping_price_currency: z.literal('NOK')
})

const itemDataSchema = z.strictObject({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(65),
  description: z.string().min(1).max(5000),
  rich_text_description: z.string().min(1).max(5000),
  short_description: z.string().min(1).max(500),
  availability: z.literal('in stock'),
  visibility: z.literal('published'),
  condition: z.literal('new'),
  price: z.string().regex(/^\d+\.\d{2} NOK$/),
  sale_price: z.string().regex(/^\d+\.\d{2} NOK$/).optional(),
  link: publicProductUrlSchema,
  image: z.array(mediaAssetSchema).min(1).max(21),
  video: z.array(mediaAssetSchema).max(20).optional(),
  brand: z.literal('Utekos'),
  item_group_id: z.string().min(1).max(100),
  google_product_category: z.string().min(1).max(250),
  fb_product_category: z.string().min(1).max(250),
  product_type: z.string().min(1).max(750),
  gtin: z.string().min(8).max(70),
  mpn: z.string().min(2).max(100),
  color: z.string().min(1).max(100),
  size: z.string().min(1).max(200),
  gender: z.enum(['female', 'male', 'unisex']),
  age_group: z.literal('adult'),
  material: z.string().min(1).max(200),
  shipping: z.array(shippingSchema).min(1),
  shipping_weight: z.string().regex(/^\d+(?:\.\d+)? (?:g|kg|lb|oz)$/),
  internal_label: z.array(z.string().min(1).max(110)).min(1),
  custom_label_0: z.string().min(1).max(100),
  custom_label_1: z.string().min(1).max(100),
  custom_label_2: z.string().min(1).max(100),
  custom_label_3: z.string().min(1).max(100),
  custom_label_4: z.string().min(1).max(100),
  custom_number_0: z.number().int().min(0).max(4_294_967_295),
  ordering_index: z.number().int().min(0)
})

const updateRequestSchema = z.strictObject({
  method: z.literal('UPDATE'),
  data: itemDataSchema
})

const deleteRequestSchema = z.strictObject({
  method: z.literal('DELETE'),
  data: z.strictObject({
    id: z.string().min(1).max(100)
  })
})

export const metaCatalogItemsBatchRequestSchema =
  z.discriminatedUnion('method', [
    updateRequestSchema,
    deleteRequestSchema
  ])

export const metaCatalogItemsBatchRequestsSchema = z
  .array(metaCatalogItemsBatchRequestSchema)
  .min(1)
  .max(3000)

export type MetaCatalogItemsBatchRequest = z.infer<
  typeof metaCatalogItemsBatchRequestSchema
>
