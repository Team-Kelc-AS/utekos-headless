import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'
import { SizeGuideJsonLd } from './components/SizeGuideJsonLd'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import styles from './page.module.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://utekos.no'),
  title:
    'Størrelsesguide for Utekos | Finn din perfekte passform',
  description:
    'Finn riktig størrelse i Utekos TechDown, Dun, Mikrofiber og Comfyrobe. Se plaggmål, måleveiledning, råd om passform og vilkår for gratis størrelsesbytte.',
  alternates: { canonical: '/handlehjelp/storrelsesguide' },
  robots: { index: true, follow: true },
  openGraph: {
    title:
      'Størrelsesguide for Utekos | Finn din perfekte passform',
    description:
      'Sammenlign plaggmål og finn riktig passform i TechDown, Dun, Mikrofiber og Comfyrobe.',
    url: '/handlehjelp/storrelsesguide',
    siteName: 'Utekos',
    images: [
      {
        url: '/og-storrelsesskjema-techdown.png',
        width: 1200,
        height: 630,
        alt: 'Måleskjema for Utekos TechDown.'
      }
    ],
    locale: 'no_NO',
    type: 'website'
  }
}
export default function SizeGuideLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <>
      <SizeGuideJsonLd />
      <UtekosBreadcrumbBar
        surface='transparent'
        items={[
          { label: 'Forsiden', href: '/' },
          { label: 'Størrelsesguide' }
        ]}
      />
      <div className={`${styles.page} bg-night rounded-xl m-4 text-foreground`}>{children}</div>
    </>
  )
}
