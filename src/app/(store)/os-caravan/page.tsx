import { Suspense } from 'react'
import { NbccFaqSection } from './components/NbccFaqSection'
import { NbccHeroSection } from './components/NbccHeroSection'
import { OsCaravanVisitSection } from './components/OsCaravanVisitSection'
import { NbccProductSection } from './components/NbccProductSection'
import { NbccProductSectionSkeleton } from './components/NbccProductSectionSkeleton'
import { NbccUseCasesSection } from './components/NbccUseCasesSection'

export default function OsCaravanPage() {
  return (
    <article data-nbcc-page className='bg-background'>
      <NbccHeroSection />
      <NbccUseCasesSection />
      <Suspense fallback={<NbccProductSectionSkeleton />}>
        <NbccProductSection />
      </Suspense>
      <OsCaravanVisitSection />
      <NbccFaqSection />
    </article>
  )
}
