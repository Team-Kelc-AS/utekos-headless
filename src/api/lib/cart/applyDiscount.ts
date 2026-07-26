// Path: src/api/lib/cart/applyDiscount.ts
'use server'

import { mutationCartDiscountCodesUpdate } from '@/api/graphql/mutations/cart'
import { shopifyFetch } from '@/api/shopify/request/fetchShopify'
import type { ShopifyDiscountCodesUpdateOperation } from '@types'
import { updateTag } from 'next/cache'
import { TAGS } from '@/api/constants'
import { normalizeCart } from '@/lib/helpers/normalizers/normalizeCart'

export async function applyDiscount(cartId: string, discountCode: string) {
  if (!cartId) {
    console.error('[applyDiscount] Mangler cartId')
    throw new Error('Kan ikke legge til rabatt: Mangler handlekurv-ID.')
  }

  try {
    const res = await shopifyFetch<ShopifyDiscountCodesUpdateOperation>({
      query: mutationCartDiscountCodesUpdate,
      variables: {
        cartId,
        discountCodes: [discountCode]
      }
    })

    if (!res.success) {
      console.error(
        '[applyDiscount] Shopify Fetch Failed:',
        JSON.stringify(res.error, null, 2)
      )
      throw new Error('Kommunikasjon med Shopify feilet.')
    }

    const { cart, userErrors } = res.body.cartDiscountCodesUpdate

    if (userErrors?.length) {
      const msg = userErrors[0]?.message ?? 'Ugyldig rabattkode.'
      console.warn(`[applyDiscount] UserError: ${msg}`)
      throw new Error(msg)
    }

    if (!cart) {
      throw new Error('Shopify returnerte ingen handlekurv etter rabattoppdateringen.')
    }

    updateTag(TAGS.cart)

    return normalizeCart(cart)
  } catch (error) {
    console.error('[applyDiscount] CRITICAL ERROR:', error)

    const message =
      error instanceof Error ? error.message : 'En ukjent feil oppstod.'
    throw new Error(message)
  }
}
