import { publicOptionSearchParamMatches } from '@/lib/products/presentation'
import type { ProductCommerceViewModel } from './productCommerceViewModelSchema'

type SearchParamsRecord = Record<
  string,
  string | string[] | undefined
>

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function resolveCommerceVariantFromSearchParams(
  commerce: ProductCommerceViewModel,
  searchParams?: SearchParamsRecord | null
) {
  const params = searchParams ?? {}
  const legacyVariantId = firstValue(params.variant)
  const legacyVariant = commerce.variants.find(
    variant => variant.commerce.id === legacyVariantId
  )

  if (legacyVariant) return legacyVariant

  const readableKeys = [
    ['farge', 'color'],
    ['storrelse', 'size'],
    ['kjonn', 'gender']
  ] as const
  const suppliedReadableKeys = readableKeys.filter(([param]) =>
    Boolean(firstValue(params[param]))
  )

  if (suppliedReadableKeys.length > 0) {
    const readableVariant = commerce.variants.find(variant =>
      suppliedReadableKeys.every(([param, optionKey]) => {
        const optionValue = variant.options[optionKey]

        return (
          optionValue &&
          publicOptionSearchParamMatches(
            optionValue,
            firstValue(params[param]) ?? ''
          )
        )
      })
    )

    if (readableVariant) return readableVariant
  }

  return (
    commerce.variants.find(
      variant => variant.commerce.id === commerce.defaultVariantId
    ) ?? commerce.variants[0]
  )
}
