import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'

export function ProductOverviewBreadcrumbs() {
  return (
    <UtekosBreadcrumbBar
      surface='transparent'
      items={[
        { label: 'Forsiden', href: '/' },
        { label: 'Produkter' }
      ]}
    />
  )
}
