// Path: src/api/graphql/queries/products/index.ts

import productFragment from '@/lib/fragments/productFragment'

export { getProductOptionsQuery } from './getProductOptionsQuery'
export { getProductCardsQuery } from './getProductCardsQuery'

export const getProductQuery = /* GraphQL */ `
  query getProduct($handle: String!) {
    product(handle: $handle) {
      ...product
    }
  }
  ${productFragment}
`

export const getFeaturedProductsQuery = /* GraphQL */ `
  query getFeaturedProducts(
    $handle0: String!
    $handle1: String!
    $handle2: String!
  ) {
    product0: product(handle: $handle0) {
      ...product
    }
    product1: product(handle: $handle1) {
      ...product
    }
    product2: product(handle: $handle2) {
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
