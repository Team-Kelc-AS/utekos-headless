import { ShippingAndReturnsPageJsonLd } from './ShippingAndReturnsPageJsonLd'
import { ShippingReturnsBreadcrumbs } from './components/ShippingReturnsBreadcrumbs'

export default function ShippingAndReturnsLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ShippingAndReturnsPageJsonLd />
      <ShippingReturnsBreadcrumbs />
      <div>{children}</div>
    </>
  )
}
