import { ProductListJsonLd } from './components/ProductListJsonLd'
import { ProductOverviewBreadcrumbJsonLd } from './components/ProductOverviewBreadcrumbJsonLd'
import { ProductOverviewBreadcrumbs } from './components/ProductOverviewBreadcrumbs'
import { ViewCategoryObserver } from '@/components/analytics/ViewCategoryObserver'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kolleksjonen for kompromissløs komfort | Utekos',
  description:
    'Utforsk hele kolleksjonen av komfortplagg fra Utekos. Våre varme og slitesterke produkter er skapt for å forlenge de gode stundene på hytten, i bobilen eller på kjølige kvelder.',
  keywords: ['Varmedress', 'Komfortplagg', 'Utekos kolleksjon', 'Hytte', 'Bobil'],
  alternates: {
    canonical: '/produkter'
  },
  openGraph: {
    type: 'website',
    locale: 'no_NO',
    url: 'https://utekos.no/produkter',
    siteName: 'Utekos',
    title: 'Kolleksjonen for kompromissløs komfort | Utekos',
    description: 'Varme og komfortable plagg for deg som elsker utelivet på hytten, i bobilen eller båten.',
    images: [
      {
        url: '/og-image-utekos-produkter.jpg',
        width: 1200,
        height: 630,
        alt: 'Kolleksjonen av komfortplagg fra Utekos'
      }
    ]
  }
}

export default function ProductListLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ViewCategoryObserver
        categoryId='produkter'
        categoryName='Kolleksjonen'
      />
      <ProductOverviewBreadcrumbJsonLd />
      <ProductListJsonLd />
      <ProductOverviewBreadcrumbs />

      {children}
    </>
  )
}
