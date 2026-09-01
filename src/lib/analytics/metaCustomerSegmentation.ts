import { z } from 'zod'

export const metaCustomerSegmentationValues = [
  'new_customer_to_business',
  'new_customer_to_business_line',
  'new_customer_to_product_area',
  'new_customer_to_medium',
  'existing_customer_to_business',
  'existing_customer_to_business_line',
  'existing_customer_to_product_area',
  'existing_customer_to_medium',
  'customer_in_loyalty_program'
] as const

export const metaCustomerSegmentationSchema = z.enum(
  metaCustomerSegmentationValues
)

export type MetaCustomerSegmentation = z.infer<
  typeof metaCustomerSegmentationSchema
>

export function deriveMetaCustomerSegmentation(
  ordersCount: number | null | undefined
): MetaCustomerSegmentation | undefined {
  if (
    !Number.isInteger(ordersCount) ||
    ordersCount === undefined ||
    ordersCount === null ||
    ordersCount < 1
  ) {
    return undefined
  }

  return ordersCount === 1 ?
      'new_customer_to_business'
    : 'existing_customer_to_business'
}
