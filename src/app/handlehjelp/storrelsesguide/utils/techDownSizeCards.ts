export type TechDownSizeCardData = {
  id: 'middels' | 'stor' | 'ekstra-stor'
  size: 'Middels' | 'Stor' | 'Ekstra stor'
  sizeCode: 'M' | 'L' | 'XL'
  heading: string
  heightGuide: string
  fitGuidance: readonly string[]
  importantNote?: string
}

export const techDownSizeCards = [
  {
    id: 'middels',
    size: 'Middels',
    sizeCode: 'M',
    heading: 'Velg Middels hvis...',
    heightGuide: '165–175 cm',
    fitGuidance: [
      'Du er lavere enn 170 cm og ønsker en romslig passform.',
      'Du ligger i øvre sjiktet (mot 175 cm) og ønsker en mer kroppsnær passform.'
    ]
  },
  {
    id: 'stor',
    size: 'Stor',
    sizeCode: 'L',
    heading: 'Velg Stor hvis...',
    heightGuide: '175–185 cm',
    fitGuidance: ['Du er lavere og ønsker romslighet.']
  },
  {
    id: 'ekstra-stor',
    size: 'Ekstra stor',
    sizeCode: 'XL',
    heading: 'Velg Ekstra stor hvis...',
    heightGuide: '185 cm og høyere',
    fitGuidance: [
      'Du er over 185 cm og ønsker ekstra lengde i kroppen og ermene.',
      'Du er lavere, men ønsker maksimal romslighet og lengde.'
    ]
  }
] as const satisfies readonly TechDownSizeCardData[]
