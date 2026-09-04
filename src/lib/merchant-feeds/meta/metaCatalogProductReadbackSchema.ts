import { z } from 'zod'

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
    url: z.url().nullish()
  })
  .passthrough()

export const metaCatalogProductsReadbackResponseSchema = z.object({
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
