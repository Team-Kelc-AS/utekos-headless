export const getCartLineIdsQuery = /* GraphQL */ `
  query getCartLineIds($cartId: ID!) {
    cart(id: $cartId) {
      lines(first: 250) {
        nodes {
          id
        }
      }
    }
  }
`
