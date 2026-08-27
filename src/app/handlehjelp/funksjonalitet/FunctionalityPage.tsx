// Path: src/app/handlehjelp/funksjonalitet/page.tsx
import type { Metadata } from 'next'
import { connection } from 'next/server'
import { FunctionalityPageHero } from './components/FunctionalityPageHero'
import { FunctionalityPageThreeModesSection } from './components/FunctionalityPageThreeModesSection'
import { FunctionalityPageVideoSection } from './components/FunctionalityPageVideoSection'

export const metadata: Metadata = {
  title: 'Slik fungerer Utekos | 3-i-1 Funksjonalitet',
  description:
    'Lær hvordan du skreddersyr din Utekos. Én modell, utallige bruksområder. Fullengde for varme, Parkas for tur. Oppjustert for rask mobilitet.'
}

export default async function FunctionalityPage() {
  await connection()

  return (
    <article className='pt-12 pb-20'>
      <FunctionalityPageHero />
      <FunctionalityPageThreeModesSection />
      <FunctionalityPageVideoSection />


    </article>
  )
}