import { ColorSelector } from '@/components/jsx/ColorSelector'
import { SizeSelector } from '@/components/jsx/SizeSelector'
import type { JSX } from 'react'
import type { RenderOptionComponentProps } from '@types'

export function renderOptionComponent(
  props: RenderOptionComponentProps
): JSX.Element | null {
  const {
    allVariants,
    onOptionChange,
    option,
    selectedVariant,
    colorHexMap,
    productHandle,
    productOptions,
    isVariantNavigationPending,
    hasVariantSelectionError
  } = props

  const optionName = option.name.toLowerCase()
  const mappedOption = productOptions?.options.find(
    candidate => candidate.name === option.name
  )
  const componentProps = {
    onSelect: onOptionChange,
    optionName: option.name,
    selectedVariant,
    values: option.optionValues.map(v => v.name),
    variants: allVariants,
    colorHexMap,
    productHandle,
    optionValues: mappedOption?.optionValues ?? [],
    isSelectionDisabled: Boolean(
      isVariantNavigationPending || hasVariantSelectionError
    )
  }

  if (optionName === 'størrelse') {
    return <SizeSelector key={option.name} {...componentProps} />
  }
  if (optionName === 'farge') {
    return (
      <ColorSelector key={option.name} {...componentProps} />
    )
  }
  return null
}
