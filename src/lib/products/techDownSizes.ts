import { slugifyVariantOption } from '@/lib/utils/slugifyVariantOption'

export const TECH_DOWN_SIZES = [
  {
    size: 'Liten',
    id: 'liten',
    sizeCode: 'S',
    public: false,
    aliases: ['small', 's']
  },
  {
    size: 'Middels',
    id: 'middels',
    sizeCode: 'M',
    public: true,
    aliases: ['medium', 'm'],
    heightGuide: '165–175 cm',
    fitGuidance: [
      'Du er mellom 165–175 cm og ønsker en romslig passform.',
      'Du ligger i øvre sjiktet (mot 175 cm) og ønsker en mer kroppsnær passform.'
    ],
    measurements: {
      length: '162 cm',
      chest: '56 cm',
      armCenter: '82 cm'
    }
  },
  {
    size: 'Stor',
    id: 'stor',
    sizeCode: 'L',
    public: true,
    aliases: ['large', 'l'],
    heightGuide: '175–185 cm',
    fitGuidance: [
      'Du er mellom 175–185 cm og ønsker romslighet.',
      'Du ligger i øvre sjiktet (mot 185 cm) og ønsker en mer kroppsnær passform.'
    ],
    measurements: {
      length: '166 cm',
      chest: '58 cm',
      armCenter: '87 cm'
    }
  },
  {
    size: 'Større',
    id: 'storre',
    sizeCode: 'XL',
    public: true,
    aliases: ['ekstra stor', 'extra large', 'xl'],
    heightGuide: '185 cm og høyere',
    fitGuidance: [
      'Du er over 185 cm.',
      'Du er lavere, men kraftig bygget og ønsker ekstra romslighet.'
    ],
    measurements: {
      length: '170 cm',
      chest: '61 cm',
      armCenter: '92 cm'
    }
  }
] as const

export type TechDownSize =
  (typeof TECH_DOWN_SIZES)[number]['size']

export const TECH_DOWN_PUBLIC_SIZE_DEFINITIONS =
  TECH_DOWN_SIZES.filter(size => size.public)
export type PublicTechDownSizeDefinition =
  (typeof TECH_DOWN_PUBLIC_SIZE_DEFINITIONS)[number]
export type PublicTechDownSize =
  PublicTechDownSizeDefinition['size']

export const TECH_DOWN_PUBLIC_SIZES =
  TECH_DOWN_PUBLIC_SIZE_DEFINITIONS.map(size => size.size)
export const TECH_DOWN_HIDDEN_SIZES = TECH_DOWN_SIZES.filter(
  size => !size.public
).map(size => size.size)

export const TECH_DOWN_SIZE_VALUE_MAP: Readonly<
  Record<string, TechDownSize>
> = Object.fromEntries(
  TECH_DOWN_SIZES.flatMap(size =>
    [size.id, ...size.aliases].map(alias => [alias, size.size])
  )
)

export function resolveTechDownSizeValue(
  rawValue: string
): TechDownSize | null {
  return (
    TECH_DOWN_SIZE_VALUE_MAP[
      slugifyVariantOption(rawValue).replaceAll('-', ' ')
    ] ?? null
  )
}

const measurementLabels = {
  length: 'Lengde',
  chest: 'Bryst',
  armCenter: 'Ermlengde'
} as const satisfies Record<
  keyof PublicTechDownSizeDefinition['measurements'],
  string
>

export const TECH_DOWN_MEASUREMENT_COLUMNS = (
  Object.entries(measurementLabels) as [
    keyof typeof measurementLabels,
    (typeof measurementLabels)[keyof typeof measurementLabels]
  ][]
).map(([key, label]) => ({ key, label }))

/** One row per measurement — used by text/NBCC facts. */
export const TECH_DOWN_MEASUREMENT_ROWS = Object.entries(
  measurementLabels
).map(([key, measurement]) => ({
  measurement,
  values: TECH_DOWN_PUBLIC_SIZE_DEFINITIONS.map(
    size =>
      size.measurements[key as keyof typeof measurementLabels]
  )
}))

/** One row per size — used by visible size charts. */
export const TECH_DOWN_SIZE_ROWS =
  TECH_DOWN_PUBLIC_SIZE_DEFINITIONS.map(size => ({
    size: size.size,
    values: TECH_DOWN_MEASUREMENT_COLUMNS.map(
      column => size.measurements[column.key]
    )
  }))
