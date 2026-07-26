const productOptionVariant = /* GraphQL */ `
  fragment productOptionVariant on ProductVariant {
    id
    availableForSale
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
      handle
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
