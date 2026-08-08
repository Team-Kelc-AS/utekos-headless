// Path: types/cart/CartProductVariant.ts

import type { Image } from 'types/media'
import type { Money } from 'types/commerce/Money'
import type { CartProduct } from './CartProduct'

export type CartProductVariant = {
  id: string
  title: string
  availableForSale: boolean
  price: Money
  image: Image | null
  compareAtPrice: Money | null
  selectedOptions: { name: string; value: string }[]
  product: CartProduct
}
