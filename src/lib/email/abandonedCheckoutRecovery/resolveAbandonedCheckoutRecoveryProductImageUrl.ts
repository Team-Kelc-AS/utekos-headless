const IMAGE_ORIGIN = 'https://utekos.no'
const VARIANT_IMAGE_PATH_PREFIX = '/email/abandoned-checkout/'
const GTIN_IMAGE_PATH_PREFIX = '/gtin/product-images/'
const ALLOWED_IMAGE_HOSTNAMES = new Set([
  'utekos.no',
  'cdn.shopify.com'
])

export const ABANDONED_CHECKOUT_RECOVERY_IMAGE_PATH_BY_VARIANT_ID: Readonly<
  Record<string, string>
> = {}

export const ABANDONED_CHECKOUT_RECOVERY_IMAGE_PATH_BY_GTIN: Readonly<
  Record<string, string>
> = {
  '07090062980009': '/gtin/product-images/07090062980009.png',
  '07090062980016': '/gtin/product-images/07090062980016.png',
  '07090062980023': '/gtin/product-images/07090062980023.png',
  '07090062980030': '/gtin/product-images/07090062980030.png',
  '07090062980047': '/gtin/product-images/07090062980047.png',
  '07090062980054': '/gtin/product-images/07090062980054.png',
  '07090062980061': '/gtin/product-images/07090062980061.png',
  '07090062980078': '/gtin/product-images/07090062980078.png',
  '07090062980085': '/gtin/product-images/07090062980085.png',
  '07090062980092': '/gtin/product-images/07090062980092.png',
  '07090062980108': '/gtin/product-images/07090062980108.png',
  '07090062980115': '/gtin/product-images/07090062980115.png',
  '07090062980122': '/gtin/product-images/07090062980122.png',
  '07090062980139': '/gtin/product-images/07090062980139.png',
  '07090062980146': '/gtin/product-images/07090062980146.png'
}

export type AbandonedCheckoutRecoveryImageSource = {
  variantId: string | null
  barcode: string | null
  curatedImageUrl: string | null
  shopifyLineItemImageUrl: string | null
}

export type AbandonedCheckoutRecoveryImageMappings = {
  variantImagePathById?: Readonly<Record<string, string>>
  gtinImagePathByBarcode?: Readonly<Record<string, string>>
}

export function isSafeAbandonedCheckoutRecoveryProductImageUrl(
  value: string | null
): value is string {
  if (!value) {
    return false
  }

  let url: URL

  try {
    url = new URL(value)
  } catch {
    return false
  }

  if (
    url.protocol !== 'https:'
    || !ALLOWED_IMAGE_HOSTNAMES.has(url.hostname)
    || url.username !== ''
    || url.password !== ''
    || url.port !== ''
    || url.hash !== ''
    || value.includes('#')
  ) {
    return false
  }

  if (url.hostname === 'utekos.no') {
    return url.search === '' && !value.includes('?')
  }

  const parameters = [...url.searchParams.entries()]

  if (!value.includes('?')) {
    return parameters.length === 0
  }

  return (
    parameters.length === 1
    && parameters.every(
      ([key, parameterValue]) =>
        key === 'v' && /^\d+$/u.test(parameterValue)
    )
  )
}

function resolveSafeFirstPartyImagePath(
  path: unknown,
  prefix: string
): string | null {
  if (
    typeof path !== 'string'
    || !path.startsWith(prefix)
    || path.length <= prefix.length
    || path.includes('..')
    || path.includes('//')
    || path.includes('\\')
    || path.includes('?')
    || path.includes('#')
    || !/^\/[A-Za-z0-9/_-]+\.(?:avif|jpe?g|png|webp)$/u.test(path)
  ) {
    return null
  }

  let url: URL

  try {
    url = new URL(path, IMAGE_ORIGIN)
  } catch {
    return null
  }

  if (
    url.origin !== IMAGE_ORIGIN
    || url.username !== ''
    || url.password !== ''
    || url.search !== ''
    || url.hash !== ''
  ) {
    return null
  }

  return url.toString()
}

export function resolveAbandonedCheckoutRecoveryProductImageUrl(
  source: AbandonedCheckoutRecoveryImageSource,
  mappings: AbandonedCheckoutRecoveryImageMappings = {}
): string | null {
  if (
    isSafeAbandonedCheckoutRecoveryProductImageUrl(
      source.curatedImageUrl
    )
  ) {
    return source.curatedImageUrl
  }

  const variantImagePathById =
    mappings.variantImagePathById
    ?? ABANDONED_CHECKOUT_RECOVERY_IMAGE_PATH_BY_VARIANT_ID
  const variantPath = source.variantId
    ? variantImagePathById[source.variantId]
    : null
  const variantImageUrl = resolveSafeFirstPartyImagePath(
    variantPath,
    VARIANT_IMAGE_PATH_PREFIX
  )

  if (variantImageUrl) {
    return variantImageUrl
  }

  const gtinImagePathByBarcode =
    mappings.gtinImagePathByBarcode
    ?? ABANDONED_CHECKOUT_RECOVERY_IMAGE_PATH_BY_GTIN
  const gtinPath = source.barcode
    ? gtinImagePathByBarcode[source.barcode]
    : null
  const gtinImageUrl = resolveSafeFirstPartyImagePath(
    gtinPath,
    GTIN_IMAGE_PATH_PREFIX
  )

  if (gtinImageUrl) {
    return gtinImageUrl
  }

  if (
    isSafeAbandonedCheckoutRecoveryProductImageUrl(
      source.shopifyLineItemImageUrl
    )
  ) {
    return source.shopifyLineItemImageUrl
  }

  return null
}
