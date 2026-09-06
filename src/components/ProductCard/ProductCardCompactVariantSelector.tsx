import type { ProductVariantSelectorProps } from '@types'
import { ProductVariantSelector } from './ProductVariantSelector'

type ProductCardCompactVariantSelectorProps = Pick<
  ProductVariantSelectorProps,
  | 'options'
  | 'colorHexMap'
  | 'selectedOptions'
  | 'onOptionChange'
>

export function ProductCardCompactVariantSelector({
  options,
  colorHexMap,
  selectedOptions,
  onOptionChange
}: ProductCardCompactVariantSelectorProps) {
  const selectableOptions = options.filter(option => {
    const optionName = option.name.toLowerCase()

    return (
      optionName !== 'kjønn' &&
      optionName !== 'farge' &&
      optionName !== 'color'
    )
  })

  if (selectableOptions.length === 0) {
    return null
  }

  return (
    <ProductVariantSelector
      options={selectableOptions}
      colorHexMap={colorHexMap}
      selectedOptions={selectedOptions}
      onOptionChange={onOptionChange}
      compactMobile
      hideSizeLabel
    />
  )
}
