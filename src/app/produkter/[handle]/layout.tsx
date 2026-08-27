// Path: src/app/produkter/[handle]/layout.tsx

import { ProductJsonLd } from './components/ProductJsonLd'
import type { ReactNode } from 'react'

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
      <ProductJsonLd handle={handle} />
      {children}
    </>
  )
}
