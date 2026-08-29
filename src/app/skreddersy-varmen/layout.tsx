import type { ReactNode } from 'react'
import { SkreddersyVarmenJsonLd } from './structured-data/SkreddersyVarmenJsonLd'
import { resolveSkreddersyVarmenCommerce } from './data/resolveSkreddersyVarmenCommerce'

export default async function LandingPageLayout({
  children
}: {
  children: ReactNode
}) {
  const commerce = await resolveSkreddersyVarmenCommerce()

  return (
    <>
      {commerce ?
        <SkreddersyVarmenJsonLd commerce={commerce} />
      : null}
      {children}
    </>
  )
}
