// Path: src/api/lib/cart/applyDiscount.ts
'use server'

import { mutationCartDiscountCodesUpdate } from '@/api/graphql/mutations/cart'
import { storefrontGateway } from '@/api/shopify/storefront/storefrontGateway.server'
import { getStorefrontBuyerContext } from '@/api/shopify/storefront/getStorefrontBuyerContext'
import type { ShopifyDiscountCodesUpdateOperation } from '@types'
import { updateTag } from 'next/cache'
import { TAGS } from '@/api/constants'
import { normalizeCart } from '@/lib/helpers/normalizers/normalizeCart'
import { resolveFullShopifyCartId } from '@/lib/cart/parseShopifyCartId'
import { shopifyPublicCartIdSchema } from '@/lib/cart/shopifyPublicCartIdSchema'
import { getShopifyCartCacheTag } from '@/lib/cart/getShopifyCartCacheTag'
import { logCartError } from '@/lib/cart/logCartError'
import { redactShopifyCartSecrets } from '@/lib/cart/redactShopifyCartSecrets'
import { z } from 'zod'

const discountCodeSchema = z.string().trim().min(1).max(255)

export async function applyDiscount(
  cartId: string,
  discountCode: string
) {
  const publicCartId = shopifyPublicCartIdSchema.parse(cartId)
  const parsedDiscountCode =
    discountCodeSchema.parse(discountCode)
  const { readCartIdCookie } =
    await import('@/lib/cart/readCartIdCookie')
  const fullCartId = resolveFullShopifyCartId(
    publicCartId,
    await readCartIdCookie()
  )

  if (!fullCartId) {
    throw new Error('Cart ownership verification failed.')
  }

  try {
    const context = await getStorefrontBuyerContext()
    const res =
      await storefrontGateway.mutation<ShopifyDiscountCodesUpdateOperation>({
        context,
        query: mutationCartDiscountCodesUpdate,
        variables: {
          cartId: fullCartId,
          discountCodes: [parsedDiscountCode]
        }
      })

    if (!res.success) {
      console.error('[applyDiscount] Shopify Fetch Failed')
      throw new Error('Kommunikasjon med Shopify feilet.')
    }

    const { cart, userErrors } = res.body.cartDiscountCodesUpdate

    if (userErrors?.length) {
      const msg = redactShopifyCartSecrets(
        userErrors[0]?.message ?? 'Ugyldig rabattkode.'
      )
      console.warn(`[applyDiscount] UserError: ${msg}`)
      throw new Error(msg)
    }

    if (!cart) {
      throw new Error(
        'Shopify returnerte ingen handlekurv etter rabattoppdateringen.'
      )
    }

    updateTag(TAGS.cart)
    updateTag(getShopifyCartCacheTag(fullCartId))

    return normalizeCart(cart)
  } catch (error) {
    logCartError('[applyDiscount] CRITICAL ERROR:', error)

    const message =
      error instanceof Error ?
        redactShopifyCartSecrets(error.message)
      : 'En ukjent feil oppstod.'
    throw new Error(message)
  }
}
