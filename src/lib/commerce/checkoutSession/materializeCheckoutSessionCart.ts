import type {
    ShopifyCartSnapshot,
    ShopifyCartSnapshotLine
  } from '@/lib/analytics/server/shopifyCartSnapshotStore'
  
  import {
    parseShopifyPublicCartId
  } from '@/lib/cart/parseShopifyCartId'
  
  import {
    checkoutSessionShopifyCartSchema,
    type CheckoutSessionLineItem,
    type CheckoutSessionShopifyCart
  } from './checkoutSessionSchema'
  
  import type {
    Cart,
    CartLine
  } from 'types/cart'
  
  function normalizeNonEmptyString(
    value: string | null | undefined
  ): string | null {
    if (typeof value !== 'string') {
      return null
    }
  
    const normalized =
      value.trim()
  
    return normalized.length > 0 ?
        normalized
      : null
  }
  
  function normalizeCurrencyCode(
    value: string
  ): string {
    return value
      .trim()
      .toUpperCase()
  }
  
  function normalizeAbsoluteHttpUrl(
    value: string | null
  ): string | null {
    if (!value) {
      return null
    }
  
    try {
      const url =
        new URL(value)
  
      if (
        url.protocol !== 'https:' &&
        url.protocol !== 'http:'
      ) {
        return null
      }
  
      return url.href
    } catch {
      return null
    }
  }
  
  function resolveCartLineImageUrl(
    line: CartLine
  ): string | null {
    const image =
      line.merchandise.image
  
    if (!image) {
      return null
    }
  
    const rawUrl =
      typeof image.url === 'string' ?
        image.url
      : image.url.src
  
    return normalizeAbsoluteHttpUrl(
      rawUrl
    )
  }
  
  function resolveShopifyVariantGid(
    value: string
  ): string | null {
    const normalized =
      value.trim()
  
    if (
      /^gid:\/\/shopify\/ProductVariant\/\d+$/.test(
        normalized
      )
    ) {
      return normalized
    }
  
    if (/^\d+$/.test(normalized)) {
      return `gid://shopify/ProductVariant/${normalized}`
    }
  
    return null
  }
  
  function uniqueStringValue(
    values: Array<
      string | null | undefined
    >
  ): string | null {
    const unique =
      new Set<string>()
  
    for (const value of values) {
      const normalized =
        normalizeNonEmptyString(value)
  
      if (normalized) {
        unique.add(normalized)
      }
    }
  
    if (unique.size !== 1) {
      return null
    }
  
    return (
      unique.values().next()
        .value ?? null
    )
  }
  
  function uniqueBooleanValue(
    values: Array<
      boolean | undefined
    >
  ): boolean | null {
    const unique =
      new Set<boolean>()
  
    for (const value of values) {
      if (
        typeof value === 'boolean'
      ) {
        unique.add(value)
      }
    }
  
    if (unique.size !== 1) {
      return null
    }
  
    return (
      unique.values().next()
        .value ?? null
    )
  }
  
  function normalizeProviderTimestamp(
    value: string | null | undefined
  ): string | null {
    if (!value) {
      return null
    }
  
    const timestamp =
      Date.parse(value)
  
    if (
      Number.isNaN(timestamp)
    ) {
      return null
    }
  
    return new Date(
      timestamp
    ).toISOString()
  }
  
  function snapshotLinesByVariant(
    snapshot: ShopifyCartSnapshot | null
  ): Map<
    string,
    ShopifyCartSnapshotLine[]
  > {
    const byVariant =
      new Map<
        string,
        ShopifyCartSnapshotLine[]
      >()
  
    if (!snapshot) {
      return byVariant
    }
  
    for (
      const line of
      snapshot.line_items
    ) {
      /**
       * Quantity zero is not current cart state.
       * Never let a removal/tombstone enrich into
       * a materialized active cart line.
       */
      if (line.quantity <= 0) {
        continue
      }
  
      const variantGid =
        resolveShopifyVariantGid(
          line.variant_id
        )
  
      if (!variantGid) {
        continue
      }
  
      const current =
        byVariant.get(variantGid) ??
        []
  
      current.push(line)
  
      byVariant.set(
        variantGid,
        current
      )
    }
  
    return byVariant
  }
  
  type SnapshotLineEnrichment = {
    lineKey: string | null
    sku: string | null
    taxable: boolean | null
    vendor: string | null
  }
  
  function resolveSnapshotLineEnrichment(
    cartLine: CartLine,
    snapshotLines:
      Map<
        string,
        ShopifyCartSnapshotLine[]
      >
  ): SnapshotLineEnrichment {
    const matches =
      snapshotLines.get(
        cartLine.merchandise.id
      ) ?? []
  
    /**
     * A Shopify line key is line-specific.
     *
     * We only persist it when there is exactly
     * one unambiguous snapshot candidate.
     */
    const lineKey =
      matches.length === 1 ?
        normalizeNonEmptyString(
          matches[0]?.key
        )
      : null
  
    /**
     * SKU, taxable and vendor are safe to use
     * across duplicate cart lines only if every
     * observed value agrees.
     */
    const sku =
      uniqueStringValue(
        matches.map(
          line => line.sku
        )
      )
  
    const taxable =
      uniqueBooleanValue(
        matches.map(
          line => line.taxable
        )
      )
  
    const vendor =
      uniqueStringValue(
        matches.map(
          line => line.vendor
        )
      )
  
    return {
      lineKey,
      sku,
      taxable,
      vendor
    }
  }
  
  function mapCartLine(
    line: CartLine,
    snapshotLines:
      Map<
        string,
        ShopifyCartSnapshotLine[]
      >
  ): CheckoutSessionLineItem {
    const enrichment =
      resolveSnapshotLineEnrichment(
        line,
        snapshotLines
      )
  
    const storefrontVendor =
      normalizeNonEmptyString(
        line.merchandise
          .product.vendor
      )
  
    const variantTitle =
      normalizeNonEmptyString(
        line.merchandise.title
      )
  
    return {
      line_id:
        line.id,
  
      line_key:
        enrichment.lineKey,
  
      product_id:
        line.merchandise
          .product.id,
  
      variant_id:
        line.merchandise.id,
  
      sku:
        enrichment.sku,
  
      title:
        line.merchandise
          .product.title,
  
      variant_title:
        variantTitle,
  
      vendor:
        storefrontVendor ??
        enrichment.vendor,
  
      quantity:
        line.quantity,
  
      unit_price: {
        amount:
          line.merchandise
            .price.amount,
  
        currency_code:
          normalizeCurrencyCode(
            line.merchandise
              .price.currencyCode
          )
      },
  
      line_total: {
        amount:
          line.cost.totalAmount
            .amount,
  
        currency_code:
          normalizeCurrencyCode(
            line.cost.totalAmount
              .currencyCode
          )
      },
  
      selected_options:
        line.merchandise
          .selectedOptions.map(
            option => ({
              name:
                option.name,
  
              value:
                option.value
            })
          ),
  
      image_url:
        resolveCartLineImageUrl(
          line
        ),
  
      available_for_sale:
        line.merchandise
          .availableForSale,
  
      taxable:
        enrichment.taxable
    }
  }
  
  export function resolveCheckoutSessionCartToken(
    cart: Cart
  ): string {
    const publicCartId =
      parseShopifyPublicCartId(
        cart.id
      )
  
    if (!publicCartId) {
      throw new Error(
        'Checkout Session materialization requires a canonical public Shopify Cart GID'
      )
    }
  
    const cartUrl =
      new URL(publicCartId)
  
    const encodedToken =
      cartUrl.pathname.slice(
        '/Cart/'.length
      )
  
    const cartToken =
      decodeURIComponent(
        encodedToken
      )
  
    if (
      cartToken.length === 0 ||
      /\s/u.test(cartToken)
    ) {
      throw new Error(
        'Checkout Session materialization could not resolve the Shopify cart token'
      )
    }
  
    return cartToken
  }
  
  export type MaterializeCheckoutSessionCartInput = {
    cart: Cart
  
    snapshot?:
      | ShopifyCartSnapshot
      | null
  
    observedAt: Date
  }
  
  export function materializeCheckoutSessionCart(
    input: MaterializeCheckoutSessionCartInput
  ): CheckoutSessionShopifyCart {
    if (
      Number.isNaN(
        input.observedAt.getTime()
      )
    ) {
      throw new Error(
        'Checkout Session cart materialization requires a valid observation timestamp'
      )
    }
  
    const cartToken =
      resolveCheckoutSessionCartToken(
        input.cart
      )
  
    const snapshot =
      input.snapshot ?? null
  
    if (
      snapshot &&
      snapshot.cart_token !==
        cartToken
    ) {
      throw new Error(
        'Shopify cart snapshot belongs to a different cart token'
      )
    }
  
    const snapshotLines =
      snapshotLinesByVariant(
        snapshot
      )
  
    const observedAt =
      input.observedAt
        .toISOString()
  
    const lineItems =
      input.cart.lines
        .filter(
          line =>
            line.quantity > 0
        )
        .map(
          line =>
            mapCartLine(
              line,
              snapshotLines
            )
        )
  
    return checkoutSessionShopifyCartSchema.parse({
      cart_gid:
        input.cart.id,
  
      cart_token:
        cartToken,
  
      source:
        snapshot ?
          'merged'
        : 'storefront_api',
  
      /**
       * Storefront Cart controls membership.
       *
       * Snapshot-only variants are intentionally
       * never copied into this array.
       */
      line_items:
        lineItems,
  
      total_quantity:
        input.cart.totalQuantity,
  
      subtotal: {
        amount:
          input.cart.cost
            .subtotalAmount.amount,
  
        currency_code:
          normalizeCurrencyCode(
            input.cart.cost
              .subtotalAmount
              .currencyCode
          )
      },
  
      total: {
        amount:
          input.cart.cost
            .totalAmount.amount,
  
        currency_code:
          normalizeCurrencyCode(
            input.cart.cost
              .totalAmount
              .currencyCode
          )
      },
  
      provider_updated_at:
        normalizeProviderTimestamp(
          snapshot?.updated_at
        ),
  
      first_observed_at:
        observedAt,
  
      last_observed_at:
        observedAt
    })
  }