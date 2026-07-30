import { z } from 'zod'

import { parseShopifyPublicCartId } from '@/lib/cart/parseShopifyCartId'

export const shopifyPublicCartIdSchema = z
  .string()
  .refine(value => parseShopifyPublicCartId(value) !== null, {
    message: 'Invalid public Shopify cart identity.'
  })
