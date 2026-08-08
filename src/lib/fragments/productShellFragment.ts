import seo from './seoFragment'

const productShell = /* GraphQL */ `
  fragment productShell on Product {
    id
    title
    tags
    handle
    updatedAt
    productType
    vendor
    description
    collections(first: 10) {
      nodes {
        id
        title
        handle
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
    images(first: 10) {
      edges {
        node {
          id
          url
          altText
          width
          height
        }
      }
    }
    seo {
      ...seo
    }
  }
  ${seo}
`

export default productShell
