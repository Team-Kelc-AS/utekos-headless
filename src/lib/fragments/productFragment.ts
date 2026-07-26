// Path: src/lib/fragments/productFragment.ts

import seo from './seoFragment'

const product = /* GraphQL */ `
  fragment product on Product {
    id
    title
    tags
    handle
    totalInventory
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
    availableForSale
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
    options {
      name
      optionValues {
        name
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
    variants(first: 20) {
      edges {
        node {
          id
          title
          currentlyNotInStock
          taxable
          selectedOptions {
            name
            value
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
          image {
            url
            altText
          }
          quantityAvailable
          sku
          barcode
          weight
          weightUnit
          metafield(
            namespace: "bridgeFor"
            key: "VariantHandler"
          ) {
            value
            type
            reference {
              ... on Metaobject {
                type
                images: field(key: "images") {
                  key
                  value
                  type
                  references(first: 10) {
                    nodes {
                      ... on MediaImage {
                        id
                        image {
                          url
                          altText
                          width
                          height
                        }
                      }
                    }
                  }
                }
                subtitle: field(key: "subtitle") {
                  key
                  value
                  type
                }
                colorLabel: field(key: "color_label") {
                  key
                  value
                  type
                }
                backgroundColor: field(key: "background_color") {
                  key
                  value
                  type
                }
                swatchHexcolorForVariant: field(
                  key: "swatch_hexcolor_for_variant"
                ) {
                  key
                  value
                  type
                }
                swatchHexcolorForUnselectedVariant: field(
                  key: "swatch_hexcolor_for_unselected_variant"
                ) {
                  key
                  value
                  type
                }
                length: field(key: "length") {
                  key
                  value
                  type
                }
                centerToWrist: field(key: "center_to_wrist") {
                  key
                  value
                  type
                }
                flatWidth: field(key: "flat_width") {
                  key
                  value
                  type
                }
              }
            }
          }
        }
      }
    }
    seo {
      ...seo
    }
  }
  ${seo}
`

export default product
