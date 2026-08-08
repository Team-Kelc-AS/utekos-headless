// Path: src/lib/fragments/cartFragment.ts
import cartProduct from './cartProductFragment'

const cart = /* GraphQL */ `
  fragment cart on Cart {
    id
    checkoutUrl
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 20) {
      edges {
        node {
          id
          quantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              image {
                url
                id
                altText
                width
                height
              }
              availableForSale
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
              product {
                ...cartProduct
              }
            }
          }
        }
      }
    }
    totalQuantity
  }
  ${cartProduct}
`

export default cart
