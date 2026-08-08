import productShell from './productShellFragment'
import productVariantPresentation from './productVariantPresentationFragment'

const product = /* GraphQL */ `
  fragment product on Product {
    ...productShell
    ...productVariantPresentation
  }
  ${productShell}
  ${productVariantPresentation}
`

export default product
