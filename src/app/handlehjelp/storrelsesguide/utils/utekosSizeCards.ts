export type UtekosSizeCardData = {
  id: 'medium' | 'large'
  sizeCode: 'M' | 'L'
  heading: string
  heightGuide: string
  fitGuidance: readonly string[]
}

export const utekosSizeCards = [
  {
    id: 'medium',
    sizeCode: 'M',
    heading: 'Velg medium hvis...',
    heightGuide: 'Opptil ca. 180 cm høy.',
    fitGuidance: [
      'Du ønsker en passform som er generøs og romslig, men som følger kroppen din tettere.',
      'Du ser for deg å bruke den over lettere klær som en genser eller t-skjorte.'
    ]
  },
  {
    id: 'large',
    sizeCode: 'L',
    heading: 'Velg large hvis...',
    heightGuide:
      'Over 180 cm høy, eller bevisst ønsker en overdimensjonert følelse.',
    fitGuidance: [
      'Du vil ha maksimal plass til tykke lag med klær under, som en boblejakke.',
      'Du elsker tanken på å kunne trekke den helt ned over beina for en full kokong-effekt.'
    ]
  }
] as const satisfies readonly UtekosSizeCardData[]
