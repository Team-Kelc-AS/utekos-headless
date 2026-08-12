import type { ReactNode } from 'react'
import { getTechDownCommerceViewModel } from '@/lib/products/commerce'
import { SkreddersyVarmenJsonLd } from './structured-data/SkreddersyVarmenJsonLd'

async function resolveTechDownCommerce() {
  try {
    return await getTechDownCommerceViewModel()
  } catch (error) {
    console.error(
      'TechDown commerce data is unavailable for /skreddersy-varmen JSON-LD',
      error
    )
    return null
  }
}

export default async function LandingPageLayout({
  children
}: {
  children: ReactNode
}) {
  const commerce = await resolveTechDownCommerce()

  return (
    <>
      {commerce ?
        <SkreddersyVarmenJsonLd commerce={commerce} />
      : null}
      {children}
    </>
  )
}
