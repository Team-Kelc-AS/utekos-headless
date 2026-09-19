import * as z from '@/lib/validation/zodMini'

import { parseShopifyPublicCartId } from '@/lib/cart/parseShopifyCartId'

export const shopifyPublicCartIdSchema = z
  .string()
  .check(
    z.refine(value => parseShopifyPublicCartId(value) !== null, {
      message: 'Invalid public Shopify cart identity.'
    })
  )
