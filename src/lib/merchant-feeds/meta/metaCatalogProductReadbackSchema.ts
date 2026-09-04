import { z } from 'zod'

const metaCatalogProductImageReadbackSchema = z.preprocess(
  value => {
    if (typeof value !== 'string') return value

    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  },
  z.object({ url: z.url(), tags: z.array(z.string().min(1)) })
)

export const metaCatalogProductReadbackSchema = z
  .object({
    id: z.string().min(1),
    retailer_id: z.string().min(1),
    name: z.string().min(1),
    category: z.string().nullish(),
    fb_product_category: z.string().nullish(),
    gtin: z.string().nullish(),
    manufacturer_part_number: z.string().nullish(),
    availability: z.string().nullish(),
    visibility: z.string().nullish(),
    url: z.url().nullish(),
    image_url: z.url().nullish(),
    additional_image_urls: z
      .array(z.url())
      .nullish()
      .transform(value => value ?? []),
    images: z
      .array(metaCatalogProductImageReadbackSchema)
      .nullish()
      .transform(value => value ?? []),
    image_fetch_status: z
      .enum([
        'DIRECT_UPLOAD',
        'FETCHED',
        'FETCH_FAILED',
        'NO_STATUS',
        'OUTDATED',
        'PARTIAL_FETCH'
      ])
      .nullish()
  })
  .passthrough()

export const metaCatalogProductsReadbackResponseSchema =
  z.object({
    data: z.array(metaCatalogProductReadbackSchema),
    paging: z
      .object({
        cursors: z
          .object({ after: z.string().min(1).optional() })
          .optional(),
        next: z.url().optional()
      })
      .optional()
  })

export type MetaCatalogProductReadback = z.infer<
  typeof metaCatalogProductReadbackSchema
>
