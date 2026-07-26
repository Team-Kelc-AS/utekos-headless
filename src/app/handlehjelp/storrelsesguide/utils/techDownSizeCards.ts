export type TechDownSizeCardData = {
  id: 'liten' | 'medium' | 'large'
  size: 'Liten' | 'Medium' | 'Large'
  sizeCode: 'S' | 'M' | 'L'
  heading: string
  heightGuide: string
  fitGuidance: readonly string[]
  importantNote?: string
}

export const techDownSizeCards = [
  {
    id: 'liten',
    size: 'Liten',
    sizeCode: 'S',
    heading: 'Velg liten hvis...',
    heightGuide: 'Opptil ca. 165–170 cm',
    fitGuidance: [
      'Du er noe lavere og ønsker en ekstra romslig følelse.',
      'Du er noe høyere, men ønsker en nettere silhuett uten overflødig volum.'
    ]
  },
  {
    id: 'medium',
    size: 'Medium',
    sizeCode: 'M',
    heading: 'Velg medium hvis...',
    heightGuide: 'Opptil ca. 175–180 cm',
    fitGuidance: [
      'Du er noe lavere og ønsker ekstra romslig passform.',
      'Du er noe høyere og ønsker en mer kroppsnær passform.'
    ]
  },
  {
    id: 'large',
    size: 'Large',
    sizeCode: 'L',
    heading: 'Velg large hvis...',
    heightGuide: 'Fra ca. 180–185 cm',
    fitGuidance: [
      'Du er noe lavere og ønsker ekstra romslig passform.'
    ]
  }
] as const satisfies readonly TechDownSizeCardData[]
