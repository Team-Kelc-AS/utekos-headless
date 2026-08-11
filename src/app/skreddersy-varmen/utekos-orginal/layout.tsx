import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'
import type { ReactNode } from 'react'

export default function UtekosOriginalLayout({
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
          {
            label: 'Skreddersy varmen',
            href: '/skreddersy-varmen'
          },
          { label: 'Utekos Original' }
        ]}
      />
      {children}
    </>
  )
}
