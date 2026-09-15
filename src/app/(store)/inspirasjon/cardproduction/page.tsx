import type { Metadata } from 'next'

import { CardShowCase } from './cards/CardShowCase'

export const metadata: Metadata = {
  metadataBase: new URL('https://utekos.no'),
  title: 'Kortsystem for inspirasjon',
  description: 'Intern card-production-flate for Utekos sine shadcn-baserte inspirasjonskort.',
  alternates: {
    canonical: '/inspirasjon/cardproduction'
  },
  openGraph: {
    title: 'Kortsystem for inspirasjon',
    description: 'Intern card-production-flate for Utekos sine shadcn-baserte inspirasjonskort.'
  }
}

export default function CardProductionPage() {
  return <CardShowCase />
}
