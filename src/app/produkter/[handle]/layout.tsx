// Path: src/app/produkter/[handle]/layout.tsx

import { ProductJsonLd } from './components/ProductJsonLd'
import { ProductBreadcrumbJsonLd } from './components/ProductBreadcrumbJsonLd'
import { Suspense, type ReactNode } from 'react'

type ProductLayoutProps = {
  children: ReactNode
  params: Promise<{ handle: string }>
}

export default async function ProductLayout({
  children,
  params
}: ProductLayoutProps) {
  const { handle } = await params

  return (
    <>
      <Suspense fallback={null}>
        <ProductJsonLd handle={handle} />
      </Suspense>
      <ProductBreadcrumbJsonLd handle={handle} />
      {children}
    </>
  )
}
