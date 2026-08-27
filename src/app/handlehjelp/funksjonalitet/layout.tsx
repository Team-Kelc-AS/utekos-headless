import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'
import FunctionalityPage from './FunctionalityPage'
import type { ReactNode } from 'react'
import { FunctionalityJsonLd } from './components/FunctionalityJsonLd'

export default function FunctionalityLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <>
      <FunctionalityJsonLd />
      <article className='bg-jungle text-foreground'>
        <UtekosBreadcrumbBar
          surface='transparent'
          items={[
            { label: 'Forsiden', href: '/' },
            { label: 'Funksjonalitet' }
          ]}
        />
        <FunctionalityPage />
        {children}  
      </article>
    </>
  )
}
