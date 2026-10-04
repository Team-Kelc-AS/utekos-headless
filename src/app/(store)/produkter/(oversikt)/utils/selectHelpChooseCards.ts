import { normalizeHelpChooseVariants } from './findHelpChooseVariant'
import type { HelpChooseCarouselDefinition } from './helpChooseCarouselConfig'
import { getProductPresentation } from '@/lib/products/presentation'
import { resolvePublicVariantOptions } from '@/lib/products/presentation/resolvePublicVariantOptions'
import type { ShopifyProduct } from 'types/product'

export function selectHelpChooseCards(
  carousel: HelpChooseCarouselDefinition,
  product: ShopifyProduct
) {
  const presentation = getProductPresentation(product.handle)
  const candidates = normalizeHelpChooseVariants(product).map(
    variant => {
      const options =
        presentation ?
          resolvePublicVariantOptions(
            presentation,
            variant.selectedOptions
          )
        : null
      return {
        variant,
        size:
          options?.size ??
          variant.selectedOptions.find(option =>
            ['Size', 'Størrelse', 'Str'].includes(option.name)
          )?.value,
        color:
          options?.color ??
          variant.selectedOptions.find(option =>
            ['Color', 'Farge'].includes(option.name)
          )?.value
      }
    }
  )

  return carousel.cards.flatMap(card => {
    const color = card.color ?? carousel.preferredColor
    const match = candidates.find(
      candidate =>
        candidate.size === card.size &&
        (!color || candidate.color === color)
    )
    // Never substitute another size or color when the requested variant is absent.
    if (!match) return []
    return [
      {
        variant: match.variant,
        sizeLabel: card.size,
        colorLabel: match.color,
        displayTitle: `${presentation?.displayName ?? product.title} ${card.label ?? card.size}`,
        imageSrc: card.imageSrc
      }
    ]
  })
}
