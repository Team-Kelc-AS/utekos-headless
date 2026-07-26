import cart from '@/lib/fragments/cartFragment'

const mutationDiagnostics = /* GraphQL */ `
  fragment cartMutationUserError on CartUserError {
    code
    field
    message
  }

  fragment cartMutationWarning on CartWarning {
    code
    message
    target
  }
`

export const mutationCartCreate = /* GraphQL */ `
  mutation cartCreate(
    $lines: [CartLineInput!]
    $attributes: [AttributeInput!]
    $discountCodes: [String!]
  ) {
    cartCreate(
      input: {
        lines: $lines
        attributes: $attributes
        discountCodes: $discountCodes
      }
    ) {
      cart {
        ...cart
      }
      userErrors {
        ...cartMutationUserError
      }
      warnings {
        ...cartMutationWarning
      }
    }
  }
  ${cart}
  ${mutationDiagnostics}
`

export const mutationCartLinesAdd = /* GraphQL */ `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...cart
      }
      userErrors {
        ...cartMutationUserError
      }
      warnings {
        ...cartMutationWarning
      }
    }
  }
  ${cart}
  ${mutationDiagnostics}
`

export const mutationCartLinesRemove = /* GraphQL */ `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...cart
      }
      userErrors {
        ...cartMutationUserError
      }
      warnings {
        ...cartMutationWarning
      }
    }
  }
  ${cart}
  ${mutationDiagnostics}
`

export const mutationCartLinesUpdate = /* GraphQL */ `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...cart
      }
      userErrors {
        ...cartMutationUserError
      }
      warnings {
        ...cartMutationWarning
      }
    }
  }
  ${cart}
  ${mutationDiagnostics}
`

export const mutationCartAttributesUpdate = /* GraphQL */ `
  mutation cartAttributesUpdate(
    $cartId: ID!
    $attributes: [AttributeInput!]!
  ) {
    cartAttributesUpdate(cartId: $cartId, attributes: $attributes) {
      cart {
        ...cart
      }
      userErrors {
        ...cartMutationUserError
      }
      warnings {
        ...cartMutationWarning
      }
    }
  }
  ${cart}
  ${mutationDiagnostics}
`

export const mutationCartDiscountCodesUpdate = /* GraphQL */ `
  mutation cartDiscountCodesUpdate(
    $cartId: ID!
    $discountCodes: [String!]!
  ) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      cart {
        ...cart
      }
      userErrors {
        ...cartMutationUserError
      }
      warnings {
        ...cartMutationWarning
      }
    }
  }
  ${cart}
  ${mutationDiagnostics}
`
