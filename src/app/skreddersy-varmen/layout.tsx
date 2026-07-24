import { SkreddersyVarmenJsonLd } from './utekos-orginal/components/LandingPageJsonLd'
import type { ReactNode } from 'react'

export default function LandingPageLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <>
      <SkreddersyVarmenJsonLd />
      {children}
    </>
  )
}
