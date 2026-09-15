import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'
import { CompareModelsJsonLd } from './components/CompareModelsJsonLd'
import type { ReactNode } from 'react'

export default function CompareModelsLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <>
      <CompareModelsJsonLd />
      <UtekosBreadcrumbBar
        surface='transparent'
        items={[
          { label: 'Forsiden', href: '/' },
          { label: 'Sammenlign modeller' }
        ]}
      />
      {children}
    </>
  )
}
