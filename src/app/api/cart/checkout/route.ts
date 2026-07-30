import { NextResponse } from 'next/server'

import { clearCartIdCookie } from '@/lib/actions/setCartIdInCookie'
import { readCartIdCookie } from '@/lib/cart/readCartIdCookie'
import { resolveShopifyCheckoutUrl } from '@/lib/cart/resolveShopifyCheckoutUrl'
import { fetchRawCart } from '@/lib/helpers/cart/fetchCart'

const NO_STORE_HEADERS = {
  'cache-control': 'private, no-store, max-age=0'
}

function storefrontRedirect(request: Request): NextResponse {
  return NextResponse.redirect(new URL('/', request.url), {
    status: 303,
    headers: NO_STORE_HEADERS
  })
}

export async function GET(
  request: Request
): Promise<NextResponse> {
  const cartId = await readCartIdCookie()

  if (!cartId) {
    await clearCartIdCookie()
    return storefrontRedirect(request)
  }

  const cart = await fetchRawCart(cartId)
  const checkoutUrl =
    cart ?
      resolveShopifyCheckoutUrl(
        cart.checkoutUrl,
        process.env.SHOPIFY_STORE_DOMAIN
      )
    : null

  if (!checkoutUrl) {
    return storefrontRedirect(request)
  }

  return NextResponse.redirect(checkoutUrl, {
    status: 307,
    headers: NO_STORE_HEADERS
  })
}
