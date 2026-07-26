// Path: src/lib/state/cartStore.ts
'use client'

import { createStore, type EventPayloadMap } from '@xstate/store-react'
import { removeZeroQuantityLines } from '@/lib/helpers/cart/removeZeroQuantityLines'
import type {
  CartUserInterfaceContext,
  UserInterfaceEventMap
} from 'types/cart'

export const cartStore = createStore<
  CartUserInterfaceContext,
  UserInterfaceEventMap,
  EventPayloadMap
>({
  context: {
    open: false,
    pending: 0,
    optimisticCartLines: { lines: {} }
  },
  on: {
    OPEN: context => ({ ...context, open: true }),
    CLOSE: context => ({ ...context, open: false }),
    TOGGLE: context => ({ ...context, open: !context.open }),
    PENDING_INC: context => ({ ...context, pending: context.pending + 1 }),
    PENDING_DEC: context => ({
      ...context,
      pending: Math.max(0, context.pending - 1)
    }),
    SET_LAST_OPERATION: (context, event) => ({
      ...context,
      lastOperation: event.value
    }),
    OPTIMISTIC_CART_LINES_UPDATE: (context, event) => {
      const mergedLines = {
        ...context.optimisticCartLines.lines,
        ...event.delta
      }
      const nextLines = removeZeroQuantityLines(mergedLines)
      return {
        ...context,
        optimisticCartLines: {
          ...context.optimisticCartLines,
          lines: nextLines
        }
      }
    },
    OPTIMISTIC_CART_CLEAR: context => ({
      ...context,
      optimisticCartLines: { lines: {} }
    })
  }
})
