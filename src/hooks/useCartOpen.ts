import { cartStore } from '@/lib/state/cartStore'
import { useSelector, type StoreSnapshot } from '@xstate/store-react'
import type { CartUserInterfaceContext } from 'types/cart'


export const selectIsOpen = (
  snapshot: StoreSnapshot<CartUserInterfaceContext>
): boolean => snapshot.context.open
export const useCartOpen = () => useSelector(cartStore, selectIsOpen)
