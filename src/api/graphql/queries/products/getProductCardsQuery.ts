import productCardFragment from '@/lib/fragments/productCardFragment'

export const getProductCardsQuery = /* GraphQL */ `
  query getProductCards($first: Int) {
    products(first: $first) {
      edges {
        node {
          ...productCard
        }
      }
    }
  }
  ${productCardFragment}
`
