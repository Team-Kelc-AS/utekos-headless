// Path: src/components/jsx/ColorSelector/ColorSelector.tsx

import { OptionButton } from '@/components/jsx/OptionButton'
import type { ColorSelectorProps } from '@types'

export function ColorSelector({
  optionName,
  values,
  variants,
  selectedVariant,
  onSelect,
  colorHexMap,
  optionValues,
  isSelectionDisabled = false
}: ColorSelectorProps) {
  const selectedSize = selectedVariant.selectedOptions.find(
    opt => opt.name.toLowerCase() === 'størrelse'
  )?.value

  return (
    <div
      className='space-y-3'
      role='radiogroup'
      aria-label={optionName}
    >
      {values.map(colorValue => {
        const optionValue = optionValues?.find(
          candidate => candidate.name === colorValue
        )
        const exists = optionValue?.exists ?? true
        const isDifferentProduct =
          optionValue?.isDifferentProduct ?? false
        const hasTargetVariant =
          optionValue ? Boolean(optionValue.variantId) : true
        const isDisabled =
          isSelectionDisabled ||
          !exists ||
          !hasTargetVariant ||
          isDifferentProduct
        const variantForProperties = variants.find(variant => {
          const hasColor = variant.selectedOptions.some(
            opt => opt.value === colorValue
          )
          const hasSize =
            !selectedSize ||
            variant.selectedOptions.some(
              opt => opt.value === selectedSize
            )
          return hasColor && hasSize
        })

        const variantProfileRef =
          variantForProperties?.variantProfile?.reference

        const colorLabel =
          variantProfileRef?.colorLabel?.value || colorValue
        const backgroundColor =
          variantProfileRef?.backgroundColor?.value
        const swatchDotColor = colorHexMap.get(colorValue)

        const isSelected = selectedVariant.selectedOptions.some(
          opt => opt.value === colorValue
        )
        const isAvailable =
          isSelected ?
            selectedVariant.availableForSale
          : (optionValue?.variantAvailableForSale ?? true)

        return (
          <OptionButton
            key={colorValue}
            isSelected={isSelected}
            isAvailable={isAvailable}
            disabled={isDisabled}
            ariaLabel={`${colorLabel}${
              (
                !exists ||
                !hasTargetVariant ||
                isDifferentProduct
              ) ?
                ', ikke tilgjengelig'
              : !isAvailable ? ', utsolgt'
              : ''
            }`}
            optionName={optionName}
            optionValue={colorValue}
            onClick={() => onSelect(optionName, colorValue)}
          >
            <span className='flex items-center gap-2 text-foreground'>
              <span className='font-utekos-text-medium'>
                {colorLabel}
              </span>
              {(
                !exists ||
                !hasTargetVariant ||
                isDifferentProduct ||
                !isAvailable
              ) ?
                <span className='text-xs font-normal text-foreground/70'>
                  {(
                    !exists ||
                    !hasTargetVariant ||
                    isDifferentProduct
                  ) ?
                    'Ikke tilgjengelig'
                  : 'Utsolgt'}
                </span>
              : null}
            </span>
            <div
              className='color-swatch-container text-foreground'
              style={
                {
                  '--swatch-bg': backgroundColor
                } as React.CSSProperties
              }
            >
              <div
                className='color-swatch-dot'
                style={
                  {
                    '--swatch-dot-color': swatchDotColor
                  } as React.CSSProperties
                }
                data-selected={isSelected}
              />
            </div>
          </OptionButton>
        )
      })}
    </div>
  )
}
