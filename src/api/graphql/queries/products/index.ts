// Path: src/api/graphql/queries/products/index.ts

import productFragment from '@/lib/fragments/productFragment'

export { getProductOptionsQuery } from './getProductOptionsQuery'

export const getProductQuery = /* GraphQL */ `
  query getProduct($handle: String!) {
    product(handle: $handle) {
      ...product
    }
  }
  ${productFragment}
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
