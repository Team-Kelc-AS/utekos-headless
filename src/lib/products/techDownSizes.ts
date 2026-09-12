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
      'Du er lavere enn 170 cm og ønsker en romslig passform.',
      'Du ligger i øvre sjiktet (mot 175 cm) og ønsker en mer kroppsnær passform.'
    ],
    measurements: {
      length: '162 cm',
      chest: '56 cm',
      armCenter: '82 cm',
      armPit: '54 cm',
      frontZip: '73 cm',
      pocketZip: '13,5 cm',
      hood: '35 cm',
      pocket: '29 cm',
      cuff: '8 cm'
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
      'Du er lavere enn 180 cm og ønsker romslighet.',
      'Du ligger i øvre sjiktet (mot 185 cm) og ønsker en mer kroppsnær passform.'
    ],
    measurements: {
      length: '166 cm',
      chest: '58 cm',
      armCenter: '87 cm',
      armPit: '60 cm',
      frontZip: '74 cm',
      pocketZip: '13,5 cm',
      hood: '35 cm',
      pocket: '29 cm',
      cuff: '8,5 cm'
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
      armCenter: '92 cm',
      armPit: '64 cm',
      frontZip: '75 cm',
      pocketZip: '14 cm',
      hood: '35 cm',
      pocket: '29 cm',
      cuff: '9 cm'
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
  length: 'Total lengde (nakke til bunn)',
  chest: 'Brystvidde (flatmål)',
  armCenter: 'Ermlengde (fra senter)',
  armPit: 'Ermlengde (fra armhule)',
  frontZip: 'Lengde på glidelås (omvendt V)',
  pocketZip: 'Lengde på glidelås (sidelomme)',
  hood: 'Høyde på hette',
  pocket: 'Høyde på baklomme',
  cuff: 'Mansjetthøyde'
} as const satisfies Record<
  keyof PublicTechDownSizeDefinition['measurements'],
  string
>

export const TECH_DOWN_MEASUREMENT_ROWS = Object.entries(
  measurementLabels
).map(([key, measurement]) => ({
  measurement,
  values: TECH_DOWN_PUBLIC_SIZE_DEFINITIONS.map(
    size =>
      size.measurements[key as keyof typeof measurementLabels]
  )
}))
