import { slugifyVariantOption } from '@/lib/utils/slugifyVariantOption'
import type { ProductPresentation } from './getProductPresentation'
import type { PublicVariantOptions } from './resolvePublicVariantOptions'

type SearchParamsInput =
  | URLSearchParams
  | Pick<URLSearchParams, 'toString'>
  | string
  | null
  | undefined

function toSearchParams(input: SearchParamsInput) {
  if (!input) return new URLSearchParams()
  if (typeof input === 'string') return new URLSearchParams(input)
  return new URLSearchParams(input.toString())
}

function getReservedParamNames(presentation: ProductPresentation) {
  return new Set([
    'variant',
    ...presentation.options.flatMap(option => [
      option.publicParam,
      ...option.shopifyNames.map(slugifyVariantOption)
    ])
  ])
}

export function buildPublicVariantUrl(input: {
  presentation: ProductPresentation
  options: PublicVariantOptions
  searchParams?: SearchParamsInput
  path?: string
}) {
  const { presentation, options } = input
  const sourceParams = toSearchParams(input.searchParams)
  const reservedParamNames = getReservedParamNames(presentation)
  const nextParams = new URLSearchParams()

  for (const optionKey of presentation.publicOptionOrder) {
    const option = presentation.options.find(
      candidate => candidate.key === optionKey
    )
    const value = options[optionKey]

    if (option && value) {
      nextParams.set(option.publicParam, slugifyVariantOption(value))
    }
  }

  const preservedEntries = [...sourceParams.entries()]
    .filter(([key]) => !reservedParamNames.has(key.toLowerCase()))
    .sort(([leftKey, leftValue], [rightKey, rightValue]) =>
      leftKey === rightKey ?
        leftValue.localeCompare(rightValue)
      : leftKey.localeCompare(rightKey)
    )

  for (const [key, value] of preservedEntries) {
    nextParams.append(key, value)
  }

  const path = input.path ?? presentation.canonicalPath
  const query = nextParams.toString()

  return query ? `${path}?${query}` : path
}
