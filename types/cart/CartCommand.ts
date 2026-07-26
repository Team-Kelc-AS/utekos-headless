import type { RemoveCartLineInput, UpdateCartLineInput } from './CartActions'
import type { AddCartLineInput } from './CartLine'

export type CartCommand =
  | {
      type: 'add-lines'
      lines: AddCartLineInput[]
      discountCode?: string
    }
  | {
      type: 'update-line'
      input: UpdateCartLineInput
    }
  | {
      type: 'remove-line'
      input: RemoveCartLineInput
    }
  | {
      type: 'clear'
    }
