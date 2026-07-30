const SHOPIFY_CART_ID_PATTERN =
  /gid:\/\/shopify\/Cart\/[^?\s"'<>]+(?:\?[^\s"'<>]+)?/giu
const SHOPIFY_SECRET_QUERY_PATTERN = /([?&]key=)[^&#\s"'<>]+/giu

export function redactShopifyCartSecrets(value: string): string {
  return value
    .replace(
      SHOPIFY_CART_ID_PATTERN,
      '[SHOPIFY_CART_ID_REDACTED]'
    )
    .replace(SHOPIFY_SECRET_QUERY_PATTERN, '$1[REDACTED]')
}
