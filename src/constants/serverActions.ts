import type { CartActions } from 'types/cart/CartActions'
import { addCartLines } from '@/clients/addCartLines'
import { clearCartAction } from '@/lib/actions/cart/clearCartAction'
import { removeCartLineAction } from '@/lib/actions/cart/removeCartLineAction'
import { updateCartLineQuantityAction } from '@/lib/actions/cart/updateCartLineQuantityAction'

export const serverActions: CartActions = {
  addCartLine: addCartLines,
  updateCartLineQuantity: updateCartLineQuantityAction,
  removeCartLine: removeCartLineAction,
  clearCart: clearCartAction
}
