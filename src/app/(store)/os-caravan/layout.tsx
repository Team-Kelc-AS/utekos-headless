import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'
import type { ReactNode } from 'react'
import { NbccPageJsonLd } from './components/NbccPageJsonLd'

export default function NbccLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <>
      <NbccPageJsonLd />
      <UtekosBreadcrumbBar
        surface='transparent'
        items={[
          { label: 'Forsiden', href: '/' },
          { label: 'NBCC-medlemsfordel' }
        ]}
      />
      {children}
    </>
  )
}
