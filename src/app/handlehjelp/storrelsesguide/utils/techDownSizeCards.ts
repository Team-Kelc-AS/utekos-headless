export type TechDownSizeCardData = {
  id: 'middels' | 'stor' | 'storre'
  size: 'Middels' | 'Stor' | 'Større'
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
    fitGuidance: [
      'Du er lavere enn 180 cm og ønsker romslighet.',
      'Du ligger i øvre sjiktet (mot 185 cm) og ønsker en mer kroppsnær passform.'
    ]
  },
  {
    id: 'storre',
    size: 'Større',
    sizeCode: 'XL',
    heading: 'Velg Større hvis...',
    heightGuide: '185 cm og høyere',
    fitGuidance: [
      'Du er over 185 cm.',
      'Du er lavere, men kraftig bygget og ønsker ekstra romslighet.'
    ]
  }
] as const satisfies readonly TechDownSizeCardData[]
