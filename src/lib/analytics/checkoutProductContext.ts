import * as z from '@/lib/validation/zodMini'
import { cleanShopifyId } from '@/lib/utils/cleanShopifyId'

export const CHECKOUT_PRODUCT_CONTEXT_ATTRIBUTE =
  'utekos_product_context_v1'

const SHOPIFY_ATTRIBUTE_VALUE_MAX_LENGTH = 65_535

const productContextValueSchema = z
  .string()
  .check(z.trim(), z.minLength(1), z.maxLength(255))

const checkoutProductContextItemSchema = z.strictObject({
  item_id: productContextValueSchema,
  item_brand: z.optional(productContextValueSchema),
  item_category: z.optional(productContextValueSchema)
})

const checkoutProductContextSchema = z
  .array(checkoutProductContextItemSchema)
  .check(z.maxLength(100))

export type CheckoutProductContextItem = z.infer<
  typeof checkoutProductContextItemSchema
>

type CheckoutProductContextSourceItem = {
  item_id: string
  item_brand?: string | undefined
  item_category?: string | undefined
  product_type?: string | undefined
}

type OrderAttribute = { name: string; value: string }

export function createCheckoutProductContext(
  items: ReadonlyArray<CheckoutProductContextSourceItem>
) {
  const byItemId = new Map<string, CheckoutProductContextItem>()

  for (const item of items.slice(0, 100)) {
    const itemId = cleanShopifyId(item.item_id)?.trim()
    if (!itemId) continue

    const parsed = checkoutProductContextItemSchema.safeParse({
      item_id: itemId,
      ...(item.item_brand ?
        { item_brand: item.item_brand }
      : {}),
      ...(item.item_category || item.product_type ?
        {
          item_category: item.item_category ?? item.product_type
        }
      : {})
    })

    if (!parsed.success) continue
    byItemId.set(parsed.data.item_id, parsed.data)
  }

  return checkoutProductContextSchema.parse([
    ...byItemId.values()
  ])
}

export function checkoutProductContextToShopifyAttributes(
  items: ReadonlyArray<CheckoutProductContextSourceItem>
) {
  const context = createCheckoutProductContext(items)

  let value = JSON.stringify(context)
  while (
    context.length > 0 &&
    value.length > SHOPIFY_ATTRIBUTE_VALUE_MAX_LENGTH
  ) {
    context.pop()
    value = JSON.stringify(context)
  }

  return context.length > 0 ?
      [{ key: CHECKOUT_PRODUCT_CONTEXT_ATTRIBUTE, value }]
    : []
}

export function parseOrderProductContextFromNoteAttributes(
  noteAttributes: ReadonlyArray<OrderAttribute>
) {
  const raw = noteAttributes.find(
    attribute =>
      attribute.name === CHECKOUT_PRODUCT_CONTEXT_ATTRIBUTE
  )?.value

  if (!raw) return new Map<string, CheckoutProductContextItem>()

  try {
    const parsed = checkoutProductContextSchema.safeParse(
      JSON.parse(raw)
    )

    return new Map(
      (parsed.success ? parsed.data : []).map(item => [
        item.item_id,
        item
      ])
    )
  } catch {
    return new Map<string, CheckoutProductContextItem>()
  }
}
