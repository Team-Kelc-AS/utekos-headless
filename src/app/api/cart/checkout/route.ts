import {
  NextResponse
} from 'next/server'

import {
  createStorefrontBuyerContext
} from '@/api/shopify/storefront/createStorefrontBuyerContext'

import {
  clearCartIdCookie
} from '@/lib/actions/cart/setCartIdInCookie'

import {
  readCartIdCookie
} from '@/lib/cart/readCartIdCookie'

import {
  resolveShopifyCheckoutUrl
} from '@/lib/cart/resolveShopifyCheckoutUrl'

import {
  captureShopifyCheckoutUrl
} from '@/lib/commerce/checkoutSession/registerCanonicalBeginCheckoutAttempt'

import type {
  CheckoutSessionEnvironment
} from '@/lib/commerce/checkoutSession/checkoutSessionSchema'

import {
  fetchRawCart
} from '@/lib/helpers/cart/fetchCart'

import {
  normalizeCart
} from '@/lib/helpers/normalizers/normalizeCart'

const NO_STORE_HEADERS = {
  'cache-control':
    'private, no-store, max-age=0'
}

function storefrontRedirect(
  request: Request
): NextResponse {
  return NextResponse.redirect(
    new URL(
      '/',
      request.url
    ),
    {
      status:
        303,

      headers:
        NO_STORE_HEADERS
    }
  )
}

function resolveCheckoutSessionEnvironment():
  CheckoutSessionEnvironment {
  const vercelEnvironment =
    process.env.VERCEL_ENV

  if (
    vercelEnvironment ===
      'production' ||
    vercelEnvironment ===
      'preview' ||
    vercelEnvironment ===
      'development'
  ) {
    return vercelEnvironment
  }

  if (
    process.env.NODE_ENV ===
    'test'
  ) {
    return 'test'
  }

  if (
    process.env.NODE_ENV ===
    'production'
  ) {
    return 'production'
  }

  return 'development'
}

export async function GET(
  request: Request
): Promise<NextResponse> {
  const cartId =
    await readCartIdCookie()

  if (!cartId) {
    await clearCartIdCookie()

    return storefrontRedirect(
      request
    )
  }

  const context =
    createStorefrontBuyerContext(
      request.headers
    )

    const rawCart =
    await fetchRawCart(
      context,
      cartId
    )
  
  if (!rawCart) {
    return storefrontRedirect(
      request
    )
  }
  
  const checkoutUrl =
    resolveShopifyCheckoutUrl(
      rawCart.checkoutUrl,
      process.env.STORE_DOMAIN
    )
  
  if (!checkoutUrl) {
    return storefrontRedirect(
      request
    )
  }

  /**
   * CRITICAL ORDERING CONTRACT:
   *
   * 1. Shopify has returned the real checkout URL.
   * 2. Utekos validates the URL.
   * 3. Utekos persists the FULL PRIVATE URL in
   *    Checkout Session Registry.
   * 4. Only then do we return the 307.
   *
   * Registry failure remains fail-open for commerce:
   * a Redis/observability problem must never prevent
   * the customer from reaching Shopify checkout.
   */
    try {
      const cart =
        normalizeCart(
          rawCart
      )

    const capture =
      await captureShopifyCheckoutUrl(
        {
          cart,

          checkoutUrl,

          environment:
            resolveCheckoutSessionEnvironment()
        }
      )

    /**
     * SAFE Vercel runtime observability.
     *
     * Deliberately NEVER log:
     * - checkoutUrl.href
     * - query string
     * - Shopify capability key
     * - authenticated Cart GID
     *
     * The raw URL exists privately in Redis Registry.
     */
    console.info(
      '[checkout-session] Shopify checkout URL captured before redirect',
      {
        status:
          capture.status,

        checkoutHost:
          capture.checkout_host,

        checkoutUrlFingerprint:
          capture.checkout_url_fingerprint,

        journalStatus:
          capture.journal_status,

        ...(
          'attempt_id' in
            capture ?
            {
              attemptId:
                capture.attempt_id
            }
          : {}
        ),

        ...(
          'operational_attempt_created' in
            capture ?
            {
              operationalAttemptCreated:
                capture
                  .operational_attempt_created
            }
          : {}
        )
      }
    )
  } catch (error) {
    /**
     * Fail-open checkout.
     *
     * Do not include error.message here: future provider
     * or validation errors could accidentally embed a
     * sensitive URL/value.
     */
    console.error(
      '[checkout-session] Shopify checkout URL Registry capture failed',
      {
        errorName:
          error instanceof Error ?
            error.name
          : 'unknown_error'
      }
    )
  }

  return NextResponse.redirect(
    checkoutUrl,
    {
      status:
        307,

      headers:
        NO_STORE_HEADERS
    }
  )
}