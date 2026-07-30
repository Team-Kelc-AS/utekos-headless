const MAX_CART_ID_LENGTH = 4096
const WHITESPACE_PATTERN = /\s/u

export type ShopifyCartIdentity = Readonly<{
  fullId: string
  publicId: string
}>

function parseCanonicalCartUrl(value: string): URL | null {
  if (
    value.length === 0 ||
    value.length > MAX_CART_ID_LENGTH ||
    WHITESPACE_PATTERN.test(value)
  ) {
    return null
  }

  try {
    const cartUrl = new URL(value)
    const token = cartUrl.pathname.slice('/Cart/'.length)

    if (
      cartUrl.href !== value ||
      cartUrl.protocol !== 'gid:' ||
      cartUrl.hostname !== 'shopify' ||
      cartUrl.host !== 'shopify' ||
      cartUrl.username !== '' ||
      cartUrl.password !== '' ||
      cartUrl.port !== '' ||
      cartUrl.hash !== '' ||
      !cartUrl.pathname.startsWith('/Cart/') ||
      token.length === 0 ||
      token.includes('/')
    ) {
      return null
    }

    const decodedToken = decodeURIComponent(token)
    if (
      decodedToken.length === 0 ||
      WHITESPACE_PATTERN.test(decodedToken)
    ) {
      return null
    }

    return cartUrl
  } catch {
    return null
  }
}

export function parseShopifyCartId(
  value: string | null
): ShopifyCartIdentity | null {
  if (!value) return null

  const cartUrl = parseCanonicalCartUrl(value)
  if (!cartUrl) return null

  const entries = [...cartUrl.searchParams.entries()]
  if (
    entries.length !== 1 ||
    entries[0]?.[0] !== 'key' ||
    !entries[0][1] ||
    WHITESPACE_PATTERN.test(entries[0][1])
  ) {
    return null
  }

  return {
    fullId: value,
    publicId: `gid://shopify${cartUrl.pathname}`
  }
}

export function parseShopifyPublicCartId(
  value: string | null
): string | null {
  if (!value) return null

  const cartUrl = parseCanonicalCartUrl(value)
  if (!cartUrl || cartUrl.search !== '') return null

  return value
}

export function resolveFullShopifyCartId(
  publicId: string | null,
  fullId: string | null
): string | null {
  const parsedPublicId = parseShopifyPublicCartId(publicId)
  const parsedFullId = parseShopifyCartId(fullId)

  if (
    !parsedPublicId ||
    !parsedFullId ||
    parsedFullId.publicId !== parsedPublicId
  ) {
    return null
  }

  return parsedFullId.fullId
}
