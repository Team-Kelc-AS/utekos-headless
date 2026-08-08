import { ShippingAndReturnsPageJsonLd } from './ShippingAndReturnsPageJsonLd'
import { ShippingReturnsBreadcrumbs } from './components/ShippingReturnsBreadcrumbs'

import {
  googleSans,
  utekosText,
  utekosTextMedium
} from '@/app/fonts/font.config'
export default function ShippingAndReturnsLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ShippingAndReturnsPageJsonLd />
      <ShippingReturnsBreadcrumbs />
      <div
        className={`${utekosText.variable} ${utekosTextMedium.variable} ${googleSans.variable}`}
      >
        {children}
      </div>
    </>
  )
}
