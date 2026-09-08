// Path: types/api.types.ts

import type { Cart } from 'types/cart'
import type { DehydratedState } from '@tanstack/react-query'
import type { ShopifyProduct } from 'types/product'
import type {
  StorefrontAttributeInput,
  StorefrontCart,
  StorefrontCartAttributesUpdatePayload,
  StorefrontCartCreateInput,
  StorefrontCartCreatePayload,
  StorefrontCartDiscountCodesUpdatePayload,
  StorefrontCartLineInput,
  StorefrontCartLinesAddPayload,
  StorefrontCartLinesRemovePayload,
  StorefrontCartLinesUpdatePayload,
  StorefrontCartLineUpdateInput,
  StorefrontProductCardConnection,
  StorefrontProductConnection,
  StorefrontProduct,
  StorefrontProductQueryVariables,
  StorefrontProductCardsQueryVariables,
  StorefrontProductsQueryVariables
} from '@/api/shopify/types/storefrontApi'

export interface ProvidersProps {
  children: React.ReactNode
  cartId: string | null
  initialCart: Cart | null
  dehydratedState: DehydratedState
  recommendedProducts: ShopifyProduct[]
  accessoryProducts: ShopifyProduct[]
}
export type ShopifyOperation<TData, TVariables = never> = {
  data: TData
  variables: TVariables
}
export type ShopifyResponse<T> =
  | { success: true; status: number; body: T }
  | { success: false; status: number; error: string }

export type Connection<T> = {
  edges: Array<Edge<T>>
}

export type Edge<T> = {
  node: T
}

export type ShopifyErrorDetail = {
  message: string
  locations?: { line: number; column: number }[]
  path?: (string | number)[]
  extensions?: Record<string, unknown>
}

export type ShopifyCartOperation = ShopifyOperation<
  { cart: StorefrontCart | null },
  { cartId: string }
>
export type ShopifyDiscountCodesUpdateOperation = ShopifyOperation<
  {
    cartDiscountCodesUpdate: StorefrontCartDiscountCodesUpdatePayload
  },
  {
    cartId: string
    discountCodes: string[]
  }
>

export type ShopifyAddToCartOperation = ShopifyOperation<
  { cartLinesAdd: StorefrontCartLinesAddPayload },
  {
    cartId: string
    lines: StorefrontCartLineInput[]
  }
>

export type ShopifyCreateCartOperation = ShopifyOperation<
  { cartCreate: StorefrontCartCreatePayload },
  StorefrontCartCreateInput
>

export type ShopifyCartAttributesUpdateOperation = ShopifyOperation<
  {
    cartAttributesUpdate: StorefrontCartAttributesUpdatePayload
  },
  {
    cartId: string
    attributes: StorefrontAttributeInput[]
  }
>

export type ShopifyRemoveFromCartOperation = ShopifyOperation<
  { cartLinesRemove: StorefrontCartLinesRemovePayload },
  { cartId: string; lineIds: string[] }
>

export type ShopifyUpdateCartLineQuantityOperation = ShopifyOperation<
  { cartLinesUpdate: StorefrontCartLinesUpdatePayload },
  {
    cartId: string
    lines: StorefrontCartLineUpdateInput[]
  }
>

/**
 * Defines the shape of the input for the error detail factory.
 * The types now explicitly include `| undefined` to match Zod's `.optional()`
 * output and satisfy the `exactOptionalPropertyTypes` compiler option.
 */
export type ShopifyErrorDetailInput = {
  message: string
  locations?: { line: number; column: number }[] | undefined
  path?: (string | number)[] | undefined
  extensions?: Record<string, unknown> | undefined
}

export type ShopifyProductOperation = ShopifyOperation<
  { product: StorefrontProduct | null },
  StorefrontProductQueryVariables
>

export type ShopifyFeaturedProductsOperation = ShopifyOperation<
  {
    product0: StorefrontProduct | null
    product1: StorefrontProduct | null
    product2: StorefrontProduct | null
  },
  {
    handle0: string
    handle1: string
    handle2: string
  }
>

export type ShopifyProductsOperation = ShopifyOperation<
  { products: StorefrontProductConnection },
  StorefrontProductsQueryVariables
>

export type ShopifyProductCardsOperation = ShopifyOperation<
  { products: StorefrontProductCardConnection },
  StorefrontProductCardsQueryVariables
>

export type GetProductsParams = StorefrontProductsQueryVariables

export type GetProductsResponse = {
  success: boolean
  status: number
  body?: ShopifyProduct[]
  error?: string
}

export type ExtractVariables<T> =
  T extends { variables: object } ? T['variables'] : never
