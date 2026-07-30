import type { Cart } from 'types/cart'

type AdoptCartIdentityDependencies = {
  setCartId: (cartId: string | null) => void
  setCartCache: (cartId: string, cart: Cart) => void
  removeOtherCartCaches: (cartId: string | null) => void
}

export function adoptAuthoritativeCartIdentity(
  cartId: string | null,
  cart: Cart | null,
  dependencies: AdoptCartIdentityDependencies
): void {
  dependencies.setCartId(cartId)

  if (cartId && cart) {
    dependencies.setCartCache(cartId, cart)
  }

  dependencies.removeOtherCartCaches(cartId)
}
