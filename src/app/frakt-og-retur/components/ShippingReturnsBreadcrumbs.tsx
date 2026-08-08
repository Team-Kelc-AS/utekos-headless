import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'

export function ShippingReturnsBreadcrumbs() {
  return (
    <UtekosBreadcrumbBar
      surface='transparent'
      items={[
        { label: 'Forsiden', href: '/' },
        { label: 'Frakt, retur og refusjon' }
      ]}
    />
  )
}
