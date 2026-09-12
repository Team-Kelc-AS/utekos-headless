import { z } from 'zod'
import { publicVariantOptionsSchema } from './publicVariantOptionsSchema'
import type { StaticImageData } from 'next/image'

const staticImageSchema = z.strictObject({
  src: z.string(),
  width: z.number(),
  height: z.number(),
  blurDataURL: z.string().optional(),
  blurWidth: z.number().optional(),
  blurHeight: z.number().optional()
})

const moneySchema = z.strictObject({
  amount: z.string().regex(/^\d+(?:\.\d+)?$/),
  currencyCode: z.enum([
    'NOK',
    'EUR',
    'USD',
    'GBP',
    'SEK',
    'DKK'
  ])
})

const imageSchema = z.strictObject({
  id: z.string(),
  url: z.union([
    z.string().min(1),
    z.custom<StaticImageData>(
      value => staticImageSchema.safeParse(value).success
    )
  ]),
  altText: z.string(),
  width: z.number(),
  height: z.number()
})

const publicImageSchema = imageSchema.extend({
  url: z.url(),
  altText: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive()
})

export const selectedOptionSchema = z.strictObject({
  name: z.string().min(1),
  value: z.string().min(1)
})

const metaobjectFieldSchema = z.strictObject({
  value: z.string().nullable()
})
const variantProfileSchema = z.strictObject({
  images: z.array(imageSchema).optional(),
  subtitle: metaobjectFieldSchema.optional(),
  colorLabel: metaobjectFieldSchema.optional(),
  backgroundColor: metaobjectFieldSchema.optional(),
  swatchHexcolorForVariant: metaobjectFieldSchema.optional(),
  swatchHexcolorForUnselectedVariant:
    metaobjectFieldSchema.optional(),
  length: metaobjectFieldSchema.optional(),
  centerToWrist: metaobjectFieldSchema.optional(),
  flatWidth: metaobjectFieldSchema.optional()
})

export const purchaseVariantSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  barcode: z.string().nullable(),
  availableForSale: z.boolean(),
  currentlyNotInStock: z.boolean(),
  taxable: z.boolean(),
  selectedOptions: z.array(selectedOptionSchema),
  price: moneySchema,
  image: imageSchema.nullable(),
  compareAtPrice: moneySchema.nullable(),
  sku: z.string().optional(),
  quantityAvailable: z.number().int().nullable(),
  variantProfileData: variantProfileSchema.optional()
})

export type { PublicVariantOptions } from './publicVariantOptionsSchema'

export const productVariantSchema = purchaseVariantSchema.extend(
  {
    publicId: z.string().regex(/^variant-[a-z0-9-]+$/),
    publicPath: z.string().startsWith('/produkter/'),
    publicUrl: z.url(),
    options: publicVariantOptionsSchema,
    image: publicImageSchema.nullable()
  }
)

export const productIdentitySchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  handle: z.string().regex(/^[a-z0-9-]+$/),
  productType: z.string().min(1),
  vendor: z.string().min(1),
  collections: z.strictObject({
    nodes: z.array(
      z.strictObject({
        id: z.string().min(1),
        title: z.string()
      })
    )
  })
})

export const productPurchaseSchema =
  productIdentitySchema.extend({
    totalInventory: z.number(),
    featuredImage: imageSchema.nullable(),
    options: z.array(
      z.strictObject({
        name: z.string().min(1),
        optionValues: z.array(
          z.strictObject({ name: z.string().min(1) })
        )
      })
    ),
    variants: z.array(purchaseVariantSchema)
  })

export const productModelSchema = productPurchaseSchema.extend({
  featuredImage: publicImageSchema.nullable(),
  canonicalPath: z.string().startsWith('/produkter/'),
  canonicalUrl: z.url(),
  productGroupUrl: z.url(),
  description: z.string().min(40),
  material: z.string().min(1),
  audience: z.string().min(1),
  updatedAt: z.iso.datetime(),
  variants: z.array(productVariantSchema).min(1),
  defaultVariantId: z.string().min(1)
})

export type ProductModel = z.infer<typeof productModelSchema>
export type ProductVariant = z.infer<typeof productVariantSchema>
