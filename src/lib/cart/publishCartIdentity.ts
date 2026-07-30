import { parseShopifyCartId } from '@/lib/cart/parseShopifyCartId'

export async function publishCartIdentity(
  fullCartId: string | null,
  refreshCookie: (fullCartId: string) => Promise<void>,
  clearCookie: () => Promise<void>
): Promise<string | null> {
  const identity = parseShopifyCartId(fullCartId)
  if (!identity) {
    if (fullCartId !== null) await clearCookie()
    return null
  }

  await refreshCookie(identity.fullId)
  return identity.publicId
}
