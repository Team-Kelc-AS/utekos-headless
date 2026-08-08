const productVariantPresentation = /* GraphQL */ `
  fragment productVariantPresentation on Product {
    id
    totalInventory
    availableForSale
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
            id
            url
            altText
            width
            height
          }
          quantityAvailable
          sku
          barcode
          metafield(
            namespace: "bridgeFor"
            key: "VariantHandler"
          ) {
            reference {
              ... on Metaobject {
                images: field(key: "images") {
                  key
                  references(first: 10) {
                    nodes {
                      ... on MediaImage {
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
                subtitle: field(key: "subtitle") {
                  key
                  value
                }
                colorLabel: field(key: "color_label") {
                  key
                  value
                }
                backgroundColor: field(key: "background_color") {
                  key
                  value
                }
                swatchHexcolorForVariant: field(
                  key: "swatch_hexcolor_for_variant"
                ) {
                  key
                  value
                }
                swatchHexcolorForUnselectedVariant: field(
                  key: "swatch_hexcolor_for_unselected_variant"
                ) {
                  key
                  value
                }
                length: field(key: "length") {
                  key
                  value
                }
                centerToWrist: field(key: "center_to_wrist") {
                  key
                  value
                }
                flatWidth: field(key: "flat_width") {
                  key
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`

export default productVariantPresentation
