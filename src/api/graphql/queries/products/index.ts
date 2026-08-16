// Path: src/api/graphql/queries/products/index.ts

import productFragment from '@/lib/fragments/productFragment'
import productShellFragment from '@/lib/fragments/productShellFragment'
import productVariantPresentationFragment from '@/lib/fragments/productVariantPresentationFragment'

export { getProductOptionsQuery } from './getProductOptionsQuery'
export { getProductCardsQuery } from './getProductCardsQuery'

export const getProductShellQuery = /* GraphQL */ `
  query getProductShell($handle: String!) {
    product(handle: $handle) {
      ...productShell
    }
  }
  ${productShellFragment}
`

export const getProductVariantPresentationQuery = /* GraphQL */ `
  query getProductVariantPresentation($handle: String!) {
    product(handle: $handle) {
      ...productVariantPresentation
    }
  }
  ${productVariantPresentationFragment}
`

export const getProductsQuery = /* GraphQL */ `
  query getProducts(
    $query: String
    $first: Int
    $reverse: Boolean
    $sortKey: ProductSortKeys
  ) {
    products(
      query: $query
      first: $first
      reverse: $reverse
      sortKey: $sortKey
    ) {
      edges {
        node {
          ...product
        }
      }
    }
  }
  ${productFragment}
`
