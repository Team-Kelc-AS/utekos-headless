const productCard = /* GraphQL */ `
  fragment productCard on Product {
    id
    handle
    title
    productType
    vendor
    availableForSale
    featuredImage {
      id
      url
      altText
      width
      height
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    collections(first: 5) {
      nodes {
        id
        title
      }
    }
    options {
      name
      optionValues {
        name
      }
    }
    variants(first: 20) {
      edges {
        node {
          id
          title
          barcode
          availableForSale
          currentlyNotInStock
          taxable
          sku
          quantityAvailable
          selectedOptions {
            name
            value
          }
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          image {
            id
            url
            altText
            width
            height
          }
        }
      }
    }
  }
`

export default productCard
