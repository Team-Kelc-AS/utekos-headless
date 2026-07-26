// Path: types/cart/Cart.ts

import type { CartLine } from './CartLine'
import type { Money } from 'types/commerce/Money'

export type Cart = {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: {
    totalAmount: Money
    subtotalAmount: Money
  }
  lines: CartLine[]
}
