import type { Route } from 'next'

export const HERO_H1 = 'Skreddersy varmen'

export const HERO_INTRO_PARAGRAPHS = [
  'Utekos er en norsk merkevare for utendørs komfort. Våre justerbare komfortplagg kombinerer et beskyttende ytre med en myk, tilpasningsdyktig kjerne, slik at du kan skreddersy varmen etter vær, aktivitet og humør – på terrassen, på hytta, i båten eller i bobilen.',
  'Velg mellom TechDown, Mikrofiber og Dun, sammenlign modellene, finn riktig størrelse og lær hvordan du vasker og vedlikeholder plagget. Alle kjøp følger tydelige frakt- og returvilkår, og kundeservice svarer på generelle henvendelser via kontaktskjemaet.'
]

export const HERO_QUICK_LINKS: { href: Route; label: string }[] = [
  { href: '/skreddersy-varmen', label: 'Slik fungerer 3-i-1' },
  {
    href: '/handlehjelp/sammenlign-modeller',
    label: 'Sammenlign modeller'
  },
  { href: '/handlehjelp/storrelsesguide', label: 'Størrelsesguide' },
  { href: '/frakt-og-retur', label: 'Frakt og retur' }
]
