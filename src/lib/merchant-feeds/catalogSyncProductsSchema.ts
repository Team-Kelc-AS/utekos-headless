import { z } from 'zod'

const imageSchema = z.strictObject({ url: z.url() })

const metafieldValueSchema = z.strictObject({
  value: z.string()
})

const selectedOptionSchema = z.strictObject({
  name: z.string(),
  value: z.string()
})

const variantSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string(),
  sku: z.string().nullable(),
  barcode: z.string().nullable(),
  price: z.string().min(1),
  compareAtPrice: z.string().nullable(),
  inventoryQuantity: z.number().int().nullable(),
  availableForSale: z.boolean(),
  updatedAt: z.string().datetime({ offset: true }),
  image: imageSchema.nullable(),
  selectedOptions: z.array(selectedOptionSchema),
  weight: z.number().nullable(),
  weightUnit: z.enum(['g', 'kg', 'lb', 'oz']),
  customLabel0: metafieldValueSchema.nullable(),
  customLabel1: metafieldValueSchema.nullable(),
  customLabel2: metafieldValueSchema.nullable(),
  customLabel3: metafieldValueSchema.nullable(),
  customLabel4: metafieldValueSchema.nullable()
})

const productSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  handle: z.string().min(1),
  productType: z.string().nullable(),
  descriptionHtml: z.string(),
  vendor: z.string().nullable(),
  status: z.string(),
  updatedAt: z.string().datetime({ offset: true }),
  featuredImage: imageSchema.nullable(),
  images: z.array(imageSchema),
  variants: z.strictObject({
    edges: z.array(z.strictObject({ node: variantSchema }))
  })
})

export const catalogSyncProductsSchema = z.array(productSchema)
