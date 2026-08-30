import { Suspense, type ReactNode } from 'react'
import { SkreddersyVarmenJsonLd } from './structured-data/SkreddersyVarmenJsonLd'
import { resolveSkreddersyVarmenCommerce } from './data/resolveSkreddersyVarmenCommerce'

async function SkreddersyVarmenStructuredData() {
  const commerce = await resolveSkreddersyVarmenCommerce()

  return commerce ?
      <SkreddersyVarmenJsonLd commerce={commerce} />
    : null
}

export default function LandingPageLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <>
      <Suspense fallback={null}>
        <SkreddersyVarmenStructuredData />
      </Suspense>
      {children}
    </>
  )
}
