const IMAGE_ORIGIN = 'https://utekos.no'
const IMAGE_PATH_PREFIX = '/email/abandoned-checkout/'

export const ABANDONED_CHECKOUT_RECOVERY_PRODUCT_IMAGE_PATH_BY_HANDLE: Readonly<
  Record<string, string>
> = {}

function isSafeFirstPartyImagePath(path: string): boolean {
  return (
    path.startsWith(IMAGE_PATH_PREFIX)
    && !path.includes('..')
    && !path.includes('//')
    && !path.includes('\\')
    && !path.includes('?')
    && !path.includes('#')
  )
}

export function resolveAbandonedCheckoutRecoveryProductImageUrl(
  productHandle: string | null,
  imagePathByHandle: Readonly<Record<string, string>> =
    ABANDONED_CHECKOUT_RECOVERY_PRODUCT_IMAGE_PATH_BY_HANDLE
): string | null {
  if (!productHandle) {
    return null
  }

  const path = imagePathByHandle[productHandle]

  if (!path || !isSafeFirstPartyImagePath(path)) {
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
