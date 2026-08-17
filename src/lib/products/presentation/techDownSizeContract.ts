


import { slugifyVariantOption } from '@/lib/utils/slugifyVariantOption'

export const TECH_DOWN_LARGEST_PUBLIC_SIZE = 'Større' as const

export const TECH_DOWN_PUBLIC_SIZES = [
  'Middels',
  'Stor',
  TECH_DOWN_LARGEST_PUBLIC_SIZE
] as const

export const TECH_DOWN_HIDDEN_SIZES = ['Liten'] as const

export const TECH_DOWN_ALL_SIZES = [
  ...TECH_DOWN_HIDDEN_SIZES,
  ...TECH_DOWN_PUBLIC_SIZES
] as const

export type TechDownSize = (typeof TECH_DOWN_ALL_SIZES)[number]

/**
 * Shopify aliases accepted at the catalog boundary. All largest-size aliases
 * deliberately resolve to the permanent public label "Større".
 */
export const TECH_DOWN_SIZE_VALUE_MAP = {
  liten: 'Liten',
  small: 'Liten',
  s: 'Liten',
  middels: 'Middels',
  medium: 'Middels',
  m: 'Middels',
  stor: 'Stor',
  large: 'Stor',
  l: 'Stor',
  storre: TECH_DOWN_LARGEST_PUBLIC_SIZE,
  'ekstra stor': TECH_DOWN_LARGEST_PUBLIC_SIZE,
  'extra large': TECH_DOWN_LARGEST_PUBLIC_SIZE,
  xl: TECH_DOWN_LARGEST_PUBLIC_SIZE
} as const satisfies Readonly<Record<string, TechDownSize>>

export function resolveTechDownSizeValue(
  rawValue: string
): TechDownSize | null {
  const lookupValue = slugifyVariantOption(rawValue).replaceAll('-', ' ')

  return (
    TECH_DOWN_SIZE_VALUE_MAP[
      lookupValue as keyof typeof TECH_DOWN_SIZE_VALUE_MAP
    ] ?? null
  )
}