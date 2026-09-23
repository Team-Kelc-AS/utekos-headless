const productOptionVariant = /* GraphQL */ `
  fragment productOptionVariant on ProductVariant {
    id
    title
    barcode
    availableForSale
    currentlyNotInStock
    taxable
    quantityAvailable
    sku
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    product {
      handle
    }
    selectedOptions {
      name
      value
    }
  }
`

export const getProductOptionsQuery = /* GraphQL */ `
  query getProductOptions(
    $handle: String!
    $selectedOptions: [SelectedOptionInput!]
  ) {
    product(handle: $handle) {
      id
      title
      handle
      productType
      vendor
      collections(first: 5) {
        nodes {
          id
          title
        }
      }
      encodedVariantExistence
      encodedVariantAvailability
      options {
        name
        optionValues {
          name
          firstSelectableVariant {
            ...productOptionVariant
          }
        }
      }
      selectedOrFirstAvailableVariant(
        selectedOptions: $selectedOptions
        ignoreUnknownOptions: true
        caseInsensitiveMatch: true
      ) {
        ...productOptionVariant
      }
      adjacentVariants(
        selectedOptions: $selectedOptions
        ignoreUnknownOptions: true
        caseInsensitiveMatch: true
      ) {
        ...productOptionVariant
      }
    }
  }
  ${productOptionVariant}
`
