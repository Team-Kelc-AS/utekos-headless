import { Home, Car, Anchor, type LucideIcon } from 'lucide-react'

export type MomentTheme = 'jungle' | 'pine' | 'teal'

export interface Moment {
  id: string
  icon: LucideIcon
  title: string
  eyebrow: string
  description: string
  theme: MomentTheme
}

export const moments: Moment[] = [
  {
    id: 'camper',
    icon: Car,
    title: 'I bobilen',
    eyebrow: 'Ro langs veien',
    description:
      'Lett å pakke, genial i bruk. Bytt ut store pledd og ekstra jakker med ett plagg som gjør hvert eneste stopp til en varm og komfortabel opplevelse.',
    theme: 'jungle'
  },
  {
    id: 'boat',
    icon: Anchor,
    title: 'I båten',
    eyebrow: 'Kvelder på dekk',
    description:
      'Nyt solnedgangen fra dekk uten å la den kalde sjøbrisen ødelegge øyeblikket. Den beskytter mot trekk og lar deg forlenge båtkvelden i ren komfort.',
    theme: 'pine'
  },
  {
    id: 'cabin',
    icon: Home,
    title: 'På hytten',
    eyebrow: 'Varmen som venter',
    description:
      'Fra iskald ankomst til umiddelbar varme. Utekos er den perfekte hytteuniformen for de kjølige kveldene på terrassen og den ferske morgenkaffen ute.',
    theme: 'teal'
  }
]
