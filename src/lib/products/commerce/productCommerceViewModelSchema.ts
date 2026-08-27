import { z } from 'zod'

const moneySchema = z.strictObject({
  amount: z.string().regex(/^\d+(?:\.\d+)?$/),
  currencyCode: z.enum(['NOK', 'EUR', 'USD', 'GBP', 'SEK', 'DKK'])
})

const imageSchema = z.strictObject({
  id: z.string().min(1),
  url: z.url(),
  altText: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive()
})

const selectedOptionSchema = z.strictObject({
  name: z.string().min(1),
  value: z.string().min(1)
})

const productCommerceSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  handle: z.string().regex(/^[a-z0-9-]+$/),
  productType: z.string().min(1),
  vendor: z.string().min(1),
  featuredImage: imageSchema.nullable(),
  collections: z.strictObject({
    nodes: z.array(
      z.strictObject({
        id: z.string().min(1),
        title: z.string().min(1)
      })
    )
  })
})

const purchaseVariantSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  gtin: z.string().nullable(),
  availableForSale: z.boolean(),
  currentlyNotInStock: z.boolean(),
  taxable: z.boolean(),
  selectedOptions: z.array(selectedOptionSchema),
  price: moneySchema,
  image: imageSchema.nullable(),
  compareAtPrice: moneySchema.nullable(),
  sku: z.string().min(1).optional(),
  quantityAvailable: z.number().int().nullable()
})

const publicOptionsSchema = z.strictObject({
  color: z.string().min(1).optional(),
  size: z.string().min(1).optional(),
  gender: z.string().min(1).optional()
})

const publicVariantSchema = z.strictObject({
  publicId: z.string().regex(/^variant-[a-z0-9-]+$/),
  publicPath: z.string().startsWith('/produkter/'),
  publicUrl: z.url(),
  publicName: z.string().min(1),
  description: z.string().min(40),
  imageAlt: z.string().min(1),
  options: publicOptionsSchema,
  commerce: purchaseVariantSchema
})

export const productCommerceViewModelSchema = z.strictObject({
  productKey: z.string().regex(/^[a-z0-9-]+$/),
  publicHandle: z.string().regex(/^[a-z0-9-]+$/),
  canonicalPath: z.string().startsWith('/produkter/'),
  canonicalUrl: z.url(),
  productGroupID: z.string().regex(/^[a-z0-9-]+$/),
  productGroupUrl: z.url(),
  displayName: z.string().min(1),
  description: z.string().min(40),
  category: z.string().min(1),
  material: z.string().min(1),
  audience: z.string().min(1),
  suggestedMinAge: z.literal(13).optional(),
  updatedAt: z.iso.datetime(),
  product: productCommerceSchema,
  variants: z.array(publicVariantSchema).min(1),
  defaultVariantId: z.string().min(1)
})

export type ProductCommerceViewModel = z.infer<
  typeof productCommerceViewModelSchema
>

export type PublicCommerceVariant =
  ProductCommerceViewModel['variants'][number]
