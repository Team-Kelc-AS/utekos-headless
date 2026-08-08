import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'
import type { CartLine } from 'types/cart'

export function createOptimisticLineItem(
  product: ProductCartModel,
  variant: ProductPurchaseVariant,
  quantity: number,
  customPrice?: number
): CartLine {
  const unitPrice =
    customPrice !== undefined ? customPrice : parseFloat(variant.price.amount)
  const fallbackImage = {
    id: `missing_image_${product.id}`,
    url: '',
    altText: product.title,
    width: 0,
    height: 0
  }

  const image = product.featuredImage ?? variant.image ?? fallbackImage

  return {
    id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    quantity,
    cost: {
      totalAmount: {
        amount: (unitPrice * quantity).toString(),
        currencyCode: variant.price.currencyCode
      }
    },
    merchandise: {
      id: variant.id,
      title: variant.title,
      availableForSale: variant.availableForSale,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      selectedOptions: variant.selectedOptions,
      image: variant.image ?? image,
      product: {
        id: product.id,
        handle: product.handle,
        title: product.title,
        vendor: product.vendor,
        productType: product.productType
      }
    }
  }
}
