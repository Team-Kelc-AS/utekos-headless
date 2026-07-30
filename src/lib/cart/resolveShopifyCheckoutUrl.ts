const CUSTOM_CHECKOUT_HOST = 'kasse.utekos.no'

function resolveConfiguredStoreHost(
  storeDomain: string | undefined
): string | null {
  const value = storeDomain?.trim()
  if (!value) return null

  try {
    const url = new URL(
      value.includes('://') ? value : `https://${value}`
    )

    if (
      url.protocol !== 'https:' ||
      url.username !== '' ||
      url.password !== '' ||
      url.port !== '' ||
      url.pathname !== '/' ||
      url.search !== '' ||
      url.hash !== ''
    ) {
      return null
    }

    return url.hostname.toLowerCase()
  } catch {
    return null
  }
}

export function resolveShopifyCheckoutUrl(
  value: string,
  storeDomain: string | undefined
): URL | null {
  try {
    const url = new URL(value)
    const configuredStoreHost =
      resolveConfiguredStoreHost(storeDomain)

    if (
      url.protocol !== 'https:' ||
      url.username !== '' ||
      url.password !== '' ||
      url.port !== '' ||
      url.hash !== '' ||
      !url.pathname.startsWith('/cart/') ||
      (url.hostname.toLowerCase() !== CUSTOM_CHECKOUT_HOST &&
        url.hostname.toLowerCase() !== configuredStoreHost)
    ) {
      return null
    }

    return url
  } catch {
    return null
  }
}
