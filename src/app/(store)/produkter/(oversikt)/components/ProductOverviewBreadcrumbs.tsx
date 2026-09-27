import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'

export function ProductOverviewBreadcrumbs() {
  return (
    <div className='w-full bg-night'>
      <UtekosBreadcrumbBar
        surface='transparent'
        items={[
          { label: 'Forsiden', href: '/' },
          { label: 'Produkter' }
        ]}
      />
    </div>
  )
}
