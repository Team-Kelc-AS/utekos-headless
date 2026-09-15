import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'
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
      <article className='bg-background text-foreground'>
        <UtekosBreadcrumbBar
          surface='transparent'
          items={[
            { label: 'Forsiden', href: '/' },
            { label: 'Funksjonalitet' }
          ]}
        />
        {children}
      </article>
    </>
  )
}
