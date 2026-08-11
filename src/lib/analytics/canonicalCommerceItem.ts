import { z } from 'zod'

export const selectedOptionSchema = z.strictObject({
  name: z.string().min(1),
  value: z.string().min(1)
})

export const canonicalCommerceItemSchema = z.strictObject({
  item_id: z.string().min(1),
  product_id: z.string().min(1),
  variant_id: z.string().min(1),
  item_name: z.string().min(1),
  item_brand: z.string().min(1).optional(),
  item_variant: z.string().min(1).optional(),
  item_category: z.string().min(1).optional(),
  item_category2: z.string().min(1).optional(),
  item_category3: z.string().min(1).optional(),
  item_category4: z.string().min(1).optional(),
  item_category5: z.string().min(1).optional(),
  product_handle: z.string().min(1),
  product_type: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  gtin: z.string().min(1).optional(),
  quantity: z.number().int().positive(),
  unit_price: z.number().finite().nonnegative(),
  gross_unit_price: z.number().finite().nonnegative(),
  compare_at_unit_price: z
    .number()
    .finite()
    .nonnegative()
    .optional(),
  gross_compare_at_unit_price: z
    .number()
    .finite()
    .nonnegative()
    .optional(),
  discount: z.number().finite().nonnegative().optional(),
  gross_discount: z.number().finite().nonnegative().optional(),
  tax_amount: z.number().finite().nonnegative(),
  tax_rate: z.number().finite().min(0).max(1),
  taxable: z.boolean().default(true),
  price_includes_tax: z.boolean(),
  available_for_sale: z.boolean(),
  currently_not_in_stock: z.boolean(),
  quantity_available: z.number().int().nonnegative().nullable(),
  selected_options: z.array(selectedOptionSchema),
  collection_ids: z.array(z.string().min(1)),
  collection_titles: z.array(z.string().min(1))
})

export type CanonicalCommerceItem = z.infer<
  typeof canonicalCommerceItemSchema
>

export const canonicalCommerceValueSchema = z.strictObject({
  currency: z.string().regex(/^[A-Z]{3}$/),
  value: z.number().finite().nonnegative(),
  gross_value: z.number().finite().nonnegative(),
  tax_value: z.number().finite().nonnegative(),
  items: z.array(canonicalCommerceItemSchema).min(1)
})

export type CanonicalCommerceValue = z.infer<
  typeof canonicalCommerceValueSchema
>
