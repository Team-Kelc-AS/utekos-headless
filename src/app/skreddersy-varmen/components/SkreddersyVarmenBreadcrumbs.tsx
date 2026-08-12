import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'

export function SkreddersyVarmenBreadcrumbs() {
  return (
    <UtekosBreadcrumbBar
      surface='transparent'
      containerClassName='py-2.5 sm:py-3'
      items={[
        { label: 'Forsiden', href: '/' },
        { label: 'Skreddersy varmen' }
      ]}
    />
  )
}
