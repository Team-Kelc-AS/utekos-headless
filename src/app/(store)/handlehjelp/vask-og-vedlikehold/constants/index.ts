// Path: src/app/(store)/handlehjelp/vask-og-vedlikehold/constants/index.ts
import type { FAQ } from '../types'

export const PRODUCT_CARE_FAQS: FAQ[] = [
  {
    question: 'Hvor ofte bør jeg vaske Utekos-plagget mitt?',
    answer:
      'Vask sjeldnere enn du tror. Lufting mellom hver bruk er som regel nok. Vask når plagget faktisk er skittent – hyppig vask sliter mer på fibrene enn vanlig bruk.'
  },
  {
    question: 'Kan jeg bruke vanlig vaskemiddel på Utekos Dun?',
    answer:
      'Bruk helst et mildt vaskemiddel uten optisk hvitt, eller et eget dun-vaskemiddel. Vanlige vaskemidler kan tørke ut dunets naturlige fettlag og redusere isolasjonsevnen over tid.'
  },
  {
    question:
      'Hva gjør jeg hvis vann ikke lenger preller av ytterstoffet?',
    answer:
      'DWR-behandlingen kan friskes opp. Vask plagget rent, tørk det helt, og påfør en impregneringsspray jevnt over ytterstoffet. Varm aktivering i tørketrommel på lav varme låser behandlingen.'
  },
  {
    question: 'Kan dunet klumpe seg under vask?',
    answer:
      'Ja, hvis plagget ikke tørkes ordentlig. Bruk tørketrommel på lav varme med tørkeballer, og avbryt syklusen for å riste ut klumper underveis. Plagget skal være helt gjennomtørt før det legges bort.'
  },
  {
    question: 'Hvordan oppbevarer jeg plagget mellom sesonger?',
    answer:
      'Heng plagget på en stødig henger i et tørt og luftig skap. Unngå kompresjonsposer og plastomslag over lengre tid – dunet trenger luft for å bevare spensten.'
  }
]

export const MICROFIBER_DO_ITEMS = [
  'Maks 30 °C',
  'Mildt vaskemiddel',
  'Lufttørk på henger',
  'Lukk glidelåser'
] as const

export const MICROFIBER_DONT_ITEMS = [
  'Blekemidler',
  'Tøymykner',
  'Tørketrommel',
  'Lang tid i sterk sol'
] as const

export const DOWN_DO_ITEMS = [
  'Maks 30 °C',
  'Mildt dunmiddel',
  'Lukk glidelåser',
  'Vreng før vask'
] as const

export const DOWN_DONT_ITEMS = [
  'Blekemidler',
  'Tøymykner',
  'Kjemisk rens',
  'Lang kompresjon'
] as const
