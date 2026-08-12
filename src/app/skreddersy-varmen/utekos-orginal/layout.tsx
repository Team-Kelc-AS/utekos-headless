import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  alternates: {
    canonical:
      'https://utekos.no/skreddersy-varmen/utekos-orginal'
  }
}

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
