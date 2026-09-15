import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'
import { TermsPageJsonLd } from './components/TermsPageJsonLd'
import type { ReactNode } from 'react'

export default function TermsLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <>
      <TermsPageJsonLd />
      <UtekosBreadcrumbBar
        surface='transparent'
        items={[
          { label: 'Forsiden', href: '/' },
          { label: 'Vilkår og betingelser' }
        ]}
      />
      {children}
    </>
  )
}
