import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'
import type { ReactNode } from 'react'

export default function KlarnaHelpLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <>
      <UtekosBreadcrumbBar
        surface='transparent'
        items={[
          { label: 'Forsiden', href: '/' },
          { label: 'Betaling med Klarna' }
        ]}
      />
      {children}
    </>
  )
}
