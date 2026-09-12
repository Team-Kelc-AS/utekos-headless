import productCardFragment from '@/lib/fragments/productCardFragment'

export const getProductCardsQuery = /* GraphQL */ `
  query getProductCards($productHandle: String!) {
    productRecommendations(
      productHandle: $productHandle
      intent: RELATED
    ) {
      ...productCard
    }
  }
  ${productCardFragment}
`
