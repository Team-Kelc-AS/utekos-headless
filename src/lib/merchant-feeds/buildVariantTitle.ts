type VariantTitleOption = {
  name: string
  value: string
}

function getOptionValue(
  selectedOptions: VariantTitleOption[],
  names: string[]
) {
  const normalizedNames = new Set(
    names.map(name => name.toLowerCase())
  )
  const value = selectedOptions
    .find(option =>
      normalizedNames.has(option.name.trim().toLowerCase())
    )
    ?.value.trim()

  return value || ''
}

export function buildVariantTitle(
  productTitle: string,
  selectedOptions: VariantTitleOption[]
) {
  const color = getOptionValue(selectedOptions, ['color', 'farge'])
  const size = getOptionValue(selectedOptions, [
    'size',
    'størrelse',
    'str'
  ])
  const productAndColor = [productTitle.trim(), color]
    .filter(Boolean)
    .join(' ')

  return size ? `${productAndColor} – ${size}` : productAndColor
}
