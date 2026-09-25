import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { NbccPageJsonLd } from './components/NbccPageJsonLd'
import { SITE_URL } from './constants'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title:
    'Eventyrdager hos Os Caravan & Fritid AS | Utekos',
  description:
    'Møt Utekos under Eventyrdagene hos Os Caravan & Fritid AS. Se bobiler og campingvogner, og sikre deg Utekos til eksklusiv messepris fra 1 790,-.',
  keywords: [
    'Eventyrdager',
    'Os Caravan & Fritid',
    'Os Caravan',
    'Utekos',
    'bobil',
    'campingvogn',
    'camping',
    'messepris',
    'TechDown',
    'Mikrofiber'
  ],
  alternates: { canonical: '/os-caravan' },
  openGraph: {
    type: 'website',
    locale: 'no_NO',
    url: '/os-caravan',
    siteName: 'Utekos',
    title: 'Eventyrdager hos Os Caravan & Fritid AS',
    description:
      'Utekos møter Os Caravan under Eventyrdagene – bobiler, campingvogner og komfortplagg til messepris.',
    images: [
      {
        url: '/caravan-inngang.jpg',
        width: 1200,
        height: 630,
        alt: 'Eventyrdager hos Os Caravan & Fritid AS'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eventyrdager hos Os Caravan & Fritid AS',
    description:
      'Møt Utekos hos Os Caravan & Fritid AS – messepris fra 1 790,-.',
    images: ['/caravan-inngang.jpg']
  }
}

export default function OsCaravanLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <>
      <NbccPageJsonLd />
      <UtekosBreadcrumbBar
        surface='transparent'
        containerClassName='pt-5 pb-0'
        items={[
          { label: 'Forsiden', href: '/' },
          { label: 'Os Caravan & Fritid' }
        ]}
      />
      {children}
    </>
  )
}
