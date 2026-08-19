import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'
import { SizeGuideJsonLd } from './components/SizeGuideJsonLd'
import type { ReactNode } from 'react'
export default function SizeGuideLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <>
      <article>
        <SizeGuideJsonLd />
        <UtekosBreadcrumbBar
          surface='transparent'
          items={[
            { label: 'Forsiden', href: '/' },
            { label: 'Størrelsesguide' }
          ]}
        />
        {children}
      </article>
    </>
  )
}
