import * as z from '@/lib/validation/zodMini'

export const selectedOptionSchema = z.strictObject({
  name: z.string().check(z.minLength(1)),
  value: z.string().check(z.minLength(1))
})

export const canonicalCommerceItemSchema = z.strictObject({
  item_id: z.string().check(z.minLength(1)),
  product_id: z.string().check(z.minLength(1)),
  variant_id: z.string().check(z.minLength(1)),
  item_name: z.string().check(z.minLength(1)),
  item_brand: z.optional(z.string().check(z.minLength(1))),
  item_variant: z.optional(z.string().check(z.minLength(1))),
  item_category: z.optional(z.string().check(z.minLength(1))),
  item_category2: z.optional(z.string().check(z.minLength(1))),
  item_category3: z.optional(z.string().check(z.minLength(1))),
  item_category4: z.optional(z.string().check(z.minLength(1))),
  item_category5: z.optional(z.string().check(z.minLength(1))),
  product_handle: z.string().check(z.minLength(1)),
  product_type: z.optional(z.string().check(z.minLength(1))),
  sku: z.optional(z.string().check(z.minLength(1))),
  gtin: z.optional(z.string().check(z.minLength(1))),
  quantity: z.number().check(z.int(), z.gt(0)),
  unit_price: z.number().check(z.gte(0)),
  gross_unit_price: z.number().check(z.gte(0)),
  compare_at_unit_price: z.optional(z.number().check(z.gte(0))),
  gross_compare_at_unit_price: z.optional(
    z.number().check(z.gte(0))
  ),
  discount: z.optional(z.number().check(z.gte(0))),
  gross_discount: z.optional(z.number().check(z.gte(0))),
  tax_amount: z.number().check(z.gte(0)),
  tax_rate: z.number().check(z.gte(0), z.lte(1)),
  taxable: z.boolean(),
  price_includes_tax: z.boolean(),
  available_for_sale: z.boolean(),
  currently_not_in_stock: z.boolean(),
  quantity_available: z.nullable(
    z.number().check(z.int(), z.gte(0))
  ),
  selected_options: z.array(selectedOptionSchema),
  collection_ids: z.array(z.string().check(z.minLength(1))),
  collection_titles: z.array(z.string().check(z.minLength(1)))
})

export type CanonicalCommerceItem = z.infer<
  typeof canonicalCommerceItemSchema
>

export const canonicalCommerceValueSchema = z.strictObject({
  currency: z.string().check(z.regex(/^[A-Z]{3}$/)),
  value: z.number().check(z.gte(0)),
  gross_value: z.number().check(z.gte(0)),
  tax_value: z.number().check(z.gte(0)),
  items: z
    .array(canonicalCommerceItemSchema)
    .check(z.minLength(1))
})

export type CanonicalCommerceValue = z.infer<
  typeof canonicalCommerceValueSchema
>
