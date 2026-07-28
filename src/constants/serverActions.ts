import type { CartActions } from 'types/cart/CartActions'
import { addCartLines } from '@/clients/addCartLines'
import { clearCartAction } from '@/lib/actions/clearCartAction'
import { removeCartLineAction } from '@/lib/actions/removeCartLineAction'
import { updateCartLineQuantityAction } from '@/lib/actions/updateCartLineQuantityAction'

export const serverActions: CartActions = {
  addCartLine: addCartLines,
  updateCartLineQuantity: updateCartLineQuantityAction,
  removeCartLine: removeCartLineAction,
  clearCart: clearCartAction
}
