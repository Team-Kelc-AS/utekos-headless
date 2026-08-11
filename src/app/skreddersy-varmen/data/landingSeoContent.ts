// Path: src/app/skreddersy-varmen/data/landingSeoContent.ts
import type { Route } from 'next'

export const LANDING_BASE_URL = 'https://utekos.no'
export const LANDING_PAGE_URL = `${LANDING_BASE_URL}/skreddersy-varmen`
export const LANDING_LAST_UPDATED = '2026-08-11'
export const LANDING_AUTHOR_NAME = 'Utekos'

export type LandingFaqEntry = {
  question: string
  answer: string
}

export type LandingEvidenceEntry = {
  title: string
  answer: string
  href: Route
  linkLabel: string
}

export const LANDING_EVIDENCE_ENTRIES: LandingEvidenceEntry[] = [
  {
    title: '3-i-1 gir kontroll over varmen',
    answer:
      'Utekos kan brukes som parkas, oppfestet modell eller kokong. Det gjør at samme plagg fungerer når du sitter lenge ute, går en kort tur eller vil pakke bena helt inn.',
    href: '/handlehjelp/funksjonalitet' as Route,
    linkLabel: 'Se funksjonalitet'
  },
  {
    title: 'Syntetisk isolasjon tåler rå luft',
    answer:
      'Utekos TechDown™ bruker syntetisk CloudWeave™-isolasjon som fortsatt isolerer når forholdene blir fuktige. Det er relevant i norsk kystklima og ved terrasse, båt og bobil.',
    href: '/handlehjelp/teknologi-materialer' as Route,
    linkLabel: 'Se teknologi'
  },
  {
    title: 'Størrelse velges etter høyde og ønsket rom',
    answer:
      'Velg størrelse ut fra høyde, lag under og hvor lun kokongfølelse du ønsker. På denne siden kan du velge Middels, Stor eller Ekstra stor.',
    href: '/handlehjelp/storrelsesguide' as Route,
    linkLabel: 'Se størrelsesguide'
  },
  {
    title: 'Trygg kjøpsramme',
    answer:
      'Utekos sendes normalt innen 2-5 virkedager i Norge. Du har 14 dagers returfrist, og frakt- og returvilkår er samlet på en egen hjelpeside.',
    href: '/frakt-og-retur' as Route,
    linkLabel: 'Se frakt og retur'
  }
]

export const LANDING_FAQ_ENTRIES: LandingFaqEntry[] = [
  {
    question: 'Hva er Utekos TechDown™?',
    answer:
      'Utekos TechDown™ er et varmt og allsidig 3-i-1-plagg som kan brukes som parkas, oppfestet modell eller heldekkende kokong.'
  },
  {
    question: 'Hvordan fungerer 3-i-1-konstruksjonen?',
    answer:
      'Du kan bruke plagget som parkas, feste det opp for mer bevegelse eller stramme det rundt bena som en lun kokong. Poenget er å justere varmen uten å gå inn og skifte.'
  },
  {
    question: 'Fungerer Utekos i fuktig vær?',
    answer:
      'Utekos TechDown™ bruker syntetisk CloudWeave™-isolasjon som er valgt fordi syntetiske fibre fortsatt isolerer når forholdene blir fuktige.'
  },
  {
    question: 'Hvordan finner jeg riktig størrelse?',
    answer:
      'Start med høyden din og vurder hvor romslig du vil ha plagget. Bruk størrelsesguiden hvis du ligger mellom to størrelser eller vil ha ekstra plass til lag under.'
  },
  {
    question: 'Hvordan vasker jeg Utekos?',
    answer:
      'Vask skånsomt på maks 30 °C med mild såpe. La plagget lufttørke, og unngå stryking, blekemiddel og hard varme.'
  },
  {
    question: 'Hvor lang er leveringstiden?',
    answer:
      'Normal transporttid i Norge er 2–5 virkedager. Gjeldende lagerstatus vises ved størrelsesvalget.'
  },
  {
    question: 'Hvor lang returfrist har jeg?',
    answer:
      'Du har 14 kalenderdagers angrerett fra fysisk mottak. Du oppretter og betaler ordinær returfrakt selv; ved en gyldig reklamasjon dekker Utekos nødvendig returfrakt.'
  }
]
