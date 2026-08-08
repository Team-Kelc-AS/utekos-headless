// Path: src/app/frakt-og-retur/page.tsx
import { InfoSidebar } from '@/app/frakt-og-retur/components/InfoSideBar'
import { ShippingReturnsHeader } from '@/app/frakt-og-retur/components/ShippingReturnsHeader'
import { ShippingReturnsInfo } from '@/app/frakt-og-retur/components/ShippingReturnsInfo'
import { returnPolicyPageMetadata } from '@/lib/policies/returnPolicyMetadata'

export const metadata = returnPolicyPageMetadata

import { PatternFrame } from '@/components/ui/pattern-frame'

export default function ShippingAndReturnsPage() {
  return (
    <article className='dark:bg-dark-background mx-auto w-full bg-background pt-12 pb-20 sm:pt-16 sm:pb-28'>
      <ShippingReturnsHeader />

      <PatternFrame
        as='section'
        surface='transparent'
        variant='content'
        gutterWidth='clamp(1rem, 3vw, 2.5rem)'
        contentWidth='min(calc(100% - var(--pattern-gutter-width) - var(--pattern-gutter-width)), 80rem)'
        className='mt-12 py-8 sm:mt-16 lg:py-12'
        contentClassName='grid grid-cols-1 items-start gap-8 px-6 sm:px-8 lg:grid-cols-12 lg:gap-12'
      >
        <ShippingReturnsInfo />
        <InfoSidebar />
      </PatternFrame>
    </article>
  )
}
