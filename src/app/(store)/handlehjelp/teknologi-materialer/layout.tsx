import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'
import { TechJsonLd } from './components/TechJsonLd'
import type { ReactNode } from 'react'

export default function TechMaterialsLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <article className='bg-background text-foreground'>
      <TechJsonLd />
      <UtekosBreadcrumbBar
        surface='transparent'
        containerClassName='sr-only'
        items={[
          { label: 'Forsiden', href: '/' },
          { label: 'Teknologi og materialer' }
        ]}
      />
      {children}
    </article>
  )
}
