export type VippsSelectedOption = { name: string; value: string }

export function vippsPaymentDescription(
  productTitle: string,
  selectedOptions: VippsSelectedOption[]
) {
  const product = productTitle.trim()
  if (!product) throw new Error('Vipps product title is missing')
  const optionValue = (names: string[]) =>
    selectedOptions
      .find(option =>
        names.includes(
          option.name.trim().toLocaleLowerCase('nb-NO')
        )
      )
      ?.value.trim()
  const color = optionValue(['farge', 'color'])
  const size = optionValue(['størrelse', 'size'])
  const details = [color, size].filter(
    (value): value is string => Boolean(value)
  )

  return details.length ?
      `${product} ${details.join(', ')}`
    : product
}
