// Path: types/cart/CartProductVariant.ts

import type { Image } from 'types/media'
import type { Money } from 'types/commerce/Money'
import type { ProductCartModel } from 'types/product/ProductPurchaseModel'

export type CartProductVariant = {
  id: string
  title: string
  availableForSale: boolean
  price: Money
  image: Image | null
  compareAtPrice: Money | null
  selectedOptions: { name: string; value: string }[]
  product: Omit<ProductCartModel, 'featuredImage'> & {
    featuredImage: Image
  }
}
