// Path: types/cart/CartUser.ts

import type { OptimisticCartLines, LastOperation } from './CartActions'
import type { EventPayloadMap } from '@xstate/store-react'

export type CartUserInterfaceContext = {
  open: boolean
  pending: number
  lastOp?: LastOperation
  optimisticCartLines: OptimisticCartLines
}

export type UserInterfaceEventMap = {
  OPEN: EventPayloadMap
  CLOSE: EventPayloadMap
  TOGGLE: EventPayloadMap
  PENDING_INC: EventPayloadMap
  PENDING_DEC: EventPayloadMap
  SET_LAST_OPERATION: { value: LastOperation }
  OPTIMISTIC_CART_LINES_UPDATE: { delta: Record<string, number> }
  OPTIMISTIC_CART_CLEAR: EventPayloadMap
}
