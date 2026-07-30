import type { Money } from 'types/commerce/Money'
import type { Image } from 'types/media'
import type { MetaobjectReference } from './MetaobjectReference'
import type { ProductOption, SelectedOption } from './ProductTypes'

export type ProductCommerceModel = {
  id: string
  title: string
  handle: string
  productType: string
  vendor: string
  collections: {
    nodes: Array<{
      id: string
      title: string
    }>
  }
}

export type ProductPurchaseVariant = {
  id: string
  title: string
  barcode: string | null
  availableForSale: boolean
  currentlyNotInStock: boolean
  taxable: boolean
  selectedOptions: SelectedOption[]
  price: Money
  image: Image | null
  compareAtPrice: Money | null
  sku: string | undefined
  quantityAvailable: number | null
  variantProfileData?: Partial<MetaobjectReference>
}

export type ProductCartModel = ProductCommerceModel & {
  featuredImage: Image | null
}

export type ProductCardModel = ProductCartModel & {
  priceRange: {
    minVariantPrice: Money
  }
  options: ProductOption[]
  variants: {
    edges: Array<{ node: ProductPurchaseVariant }>
  }
}

/**
 * The explicit, public DTO allowed to cross the PDP Server Component boundary.
 * Shopify connections, metafield references, SEO, ranges and unrelated product
 * fields intentionally stay on the server.
 */
export type ProductPurchaseModel = ProductCommerceModel & {
  totalInventory: number
  featuredImage: Image | null
  options: ProductOption[]
  variants: ProductPurchaseVariant[]
}
