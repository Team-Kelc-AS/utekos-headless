'use server'

import { z } from 'zod'

import { logCartError } from '@/lib/cart/logCartError'
import { resolveFullShopifyCartId } from '@/lib/cart/parseShopifyCartId'
import { shopifyPublicCartIdSchema } from '@/lib/cart/shopifyPublicCartIdSchema'
import { getStorefrontBuyerContext } from '@/api/shopify/storefront/getStorefrontBuyerContext'

const cartAttributesSchema = z
  .array(
    z
      .object({
        key: z.string().min(1).max(255),
        value: z.string().max(65_535)
      })
      .strict()
  )
  .max(100)

export async function updateCartAttributesAction(
  publicCartIdInput: string,
  attributesInput: Array<{ key: string; value: string }>
): Promise<{ success: true }> {
  const publicCartId = shopifyPublicCartIdSchema.parse(
    publicCartIdInput
  )
  const attributes = cartAttributesSchema.parse(attributesInput)
  const [
    { readCartIdCookie },
    { performCartAttributesUpdateMutation }
  ] = await Promise.all([
    import('@/lib/cart/readCartIdCookie'),
    import('@/lib/actions/perform/performCartAttributesUpdateMutation')
  ])
  const fullCartId = resolveFullShopifyCartId(
    publicCartId,
    await readCartIdCookie()
  )

  if (!fullCartId) {
    throw new Error('Cart ownership verification failed.')
  }

  try {
    const context = await getStorefrontBuyerContext()
    await performCartAttributesUpdateMutation(
      context,
      fullCartId,
      attributes
    )
    return { success: true }
  } catch (error) {
    logCartError('Shopify cart attributes update failed.', error)
    throw new Error('Kunne ikke oppdatere handlekurven.')
  }
}
