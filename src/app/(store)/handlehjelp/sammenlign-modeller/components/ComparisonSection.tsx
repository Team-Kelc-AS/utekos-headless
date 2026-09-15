// Path: src/app/(store)/handlehjelp/sammenlign-modeller/components/ComparisonSection.tsx
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { ComparisonTable } from './ComparisonTable'

export function ComparisonSection() {
  return (
    <article
      id='sammenligning'
      className='overflow-hidden bg-sidebar py-20 text-sidebar-foreground sm:py-28'
    >
      <div className='mx-auto max-w-7xl px-[6vw]'>
        <div className='mb-12 grid gap-8 text-center'>
          <div>
            <BrandBadge
              label='Detaljert sammenligning'
              tone='featured'
              className='mb-6 px-6 py-3 text-sm'
            />
            <h2 className='text-sidebar-foreground'>
              Sammenlign egenskapene
            </h2>
          </div>
          <p className='utekos-section-lead mx-auto max-w-2xl text-sidebar-foreground'>
            Tabellen er laget for å gi deg en detaljert
            sammenligning av de tre Utekos-modellene. Les
            vannrett for én modell, eller loddrett for å se
            hvilken egenskap som betyr mest for deg.
          </p>
        </div>
        <ComparisonTable />
      </div>
    </article>
  )
}
