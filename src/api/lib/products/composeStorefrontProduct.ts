import type {
  StorefrontProduct,
  StorefrontProductShell,
  StorefrontProductVariantPresentation
} from '@/api/shopify/types/storefrontApi'

export function composeStorefrontProduct(
  shell: StorefrontProductShell | null,
  variantPresentation: StorefrontProductVariantPresentation | null
): StorefrontProduct | null {
  if (shell === null && variantPresentation === null) {
    return null
  }

  if (shell === null || variantPresentation === null) {
    throw new Error(
      'Shopify returned an incomplete product graph.'
    )
  }

  if (shell.id !== variantPresentation.id) {
    throw new Error('Shopify returned mismatched product graphs.')
  }

  return {
    ...shell,
    ...variantPresentation
  }
}
