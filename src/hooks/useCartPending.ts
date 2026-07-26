// Path: src/hooks/useCartPending.ts

import { cartStore } from '@/lib/state/cartStore'
import type { CartUserInterfaceContext } from 'types/cart'
import { useSelector, type StoreSnapshot } from '@xstate/store-react'

/**
 * A selector function to extract the `pending` state from the cart store snapshot.
 * @param snapshot - The current snapshot of the cart store.
 * @returns The number of pending operations.
 */
export const selectPending = (
  snapshot: StoreSnapshot<CartUserInterfaceContext>
): number => snapshot.context.pending

/**
 * A selector-based hook that subscribes to the number of pending (in-flight) cart mutations.
 * This is useful for disabling UI elements or showing a global loading indicator during an update.
 *
 * @returns The current count of pending operations.
 */
export const useCartPending = () => useSelector(cartStore, selectPending)
