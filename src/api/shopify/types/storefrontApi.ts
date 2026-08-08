import type {
  AttributeInput,
  Cart as HydrogenCart,
  CartAttributesUpdatePayload,
  CartCreatePayload,
  CartDiscountCodesUpdatePayload,
  CartInput,
  CartLine as HydrogenCartLine,
  CartLineInput,
  CartLinesAddPayload,
  CartLinesRemovePayload,
  CartLinesUpdatePayload,
  CartLineUpdateInput,
  CartUserError,
  CartWarning,
  Collection,
  Image as HydrogenImage,
  MoneyV2,
  Product as HydrogenProduct,
  ProductConnection,
  ProductOption,
  ProductOptionValue,
  ProductVariant as HydrogenProductVariant,
  QueryRootProductArgs,
  QueryRootProductsArgs,
  Seo
} from '@shopify/hydrogen-react/storefront-api-types'
import type { RawMetaobject } from 'types/product/MetaobjectReference'

export type StorefrontMoney = Pick<MoneyV2, 'amount' | 'currencyCode'>

export type StorefrontImage = Pick<
  HydrogenImage,
  'id' | 'url' | 'altText' | 'width' | 'height'
>

type StorefrontProductOption = Pick<ProductOption, 'name'> & {
  optionValues: Array<Pick<ProductOptionValue, 'name'>>
}

type StorefrontProductPriceRange = {
  minVariantPrice: StorefrontMoney
  maxVariantPrice: StorefrontMoney
}

type StorefrontVariantMetafield = {
  reference: RawMetaobject | null
}

export type StorefrontProductVariant = Pick<
  HydrogenProductVariant,
  | 'id'
  | 'title'
  | 'barcode'
  | 'availableForSale'
  | 'currentlyNotInStock'
  | 'taxable'
  | 'selectedOptions'
  | 'quantityAvailable'
  | 'sku'
> & {
  price: StorefrontMoney
  compareAtPrice: StorefrontMoney | null
  image: StorefrontImage | null
  metafield: StorefrontVariantMetafield | null
}

export type StorefrontProductShell = Pick<
  HydrogenProduct,
  | 'id'
  | 'title'
  | 'tags'
  | 'handle'
  | 'updatedAt'
  | 'productType'
  | 'vendor'
  | 'description'
> & {
  collections: {
    nodes: Array<Pick<Collection, 'id' | 'title' | 'handle'>>
  }
  compareAtPriceRange: StorefrontProductPriceRange
  priceRange: StorefrontProductPriceRange
  featuredImage: StorefrontImage | null
  images: {
    edges: Array<{ node: StorefrontImage }>
  }
  seo: Pick<Seo, 'title' | 'description'>
}

export type StorefrontProductVariantPresentation = {
  id: HydrogenProduct['id']
  totalInventory: HydrogenProduct['totalInventory']
  availableForSale: HydrogenProduct['availableForSale']
  options: StorefrontProductOption[]
  variants: {
    edges: Array<{ node: StorefrontProductVariant }>
  }
}

export type StorefrontProduct = StorefrontProductShell &
  StorefrontProductVariantPresentation

export type StorefrontProductConnection = Pick<
  ProductConnection,
  '__typename'
> & {
  edges: Array<{ node: StorefrontProduct }>
}

export type StorefrontCartProductVariant = Pick<
  HydrogenProductVariant,
  'id' | 'title' | 'availableForSale' | 'selectedOptions'
> & {
  price: StorefrontMoney
  compareAtPrice: StorefrontMoney | null
  image: StorefrontImage | null
  product: StorefrontCartProduct
}

export type StorefrontCartProduct = Pick<
  HydrogenProduct,
  'id' | 'handle' | 'title' | 'vendor' | 'productType'
>

export type StorefrontCartLine = Pick<
  HydrogenCartLine,
  'id' | 'quantity'
> & {
  cost: {
    totalAmount: StorefrontMoney
  }
  merchandise: StorefrontCartProductVariant
}

export type StorefrontCart = Pick<
  HydrogenCart,
  'id' | 'checkoutUrl' | 'totalQuantity'
> & {
  cost: {
    totalAmount: StorefrontMoney
    subtotalAmount: StorefrontMoney
  }
  lines: {
    edges: Array<{ node: StorefrontCartLine }>
  }
}

type CartPayloadSelection<TPayload extends { cart?: unknown }> = Pick<
  TPayload,
  Extract<keyof TPayload, '__typename'>
> & {
  cart: StorefrontCart | null
}

export type StorefrontCartUserError = Pick<
  CartUserError,
  'code' | 'field' | 'message'
>

export type StorefrontCartWarning = Pick<
  CartWarning,
  'code' | 'message' | 'target'
>

type CartPayloadWithUserErrorsSelection<
  TPayload extends { cart?: unknown }
> = CartPayloadSelection<TPayload> & {
  userErrors: StorefrontCartUserError[]
  warnings: StorefrontCartWarning[]
}

export type StorefrontCartCreatePayload =
  CartPayloadWithUserErrorsSelection<CartCreatePayload>
export type StorefrontCartLinesAddPayload =
  CartPayloadWithUserErrorsSelection<CartLinesAddPayload>
export type StorefrontCartLinesRemovePayload =
  CartPayloadWithUserErrorsSelection<CartLinesRemovePayload>
export type StorefrontCartLinesUpdatePayload =
  CartPayloadWithUserErrorsSelection<CartLinesUpdatePayload>
export type StorefrontCartAttributesUpdatePayload =
  CartPayloadWithUserErrorsSelection<CartAttributesUpdatePayload>
export type StorefrontCartDiscountCodesUpdatePayload =
  CartPayloadWithUserErrorsSelection<CartDiscountCodesUpdatePayload>

export type StorefrontCartCreateInput = Pick<
  CartInput,
  'lines' | 'attributes' | 'discountCodes'
>
export type StorefrontCartLineInput = CartLineInput
export type StorefrontCartLineUpdateInput = CartLineUpdateInput
export type StorefrontAttributeInput = AttributeInput

export type StorefrontProductQueryVariables = {
  handle: NonNullable<QueryRootProductArgs['handle']>
}

export type StorefrontProductsQueryVariables = Pick<
  QueryRootProductsArgs,
  'first' | 'query' | 'reverse' | 'sortKey'
>
