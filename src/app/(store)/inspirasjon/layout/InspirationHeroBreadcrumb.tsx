import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'

export function InspirationHeroBreadcrumb({
  label
}: {
  label: string
  color?: string
  textColor?: string
  icon?: unknown
}) {
  return (
    <UtekosBreadcrumbBar
      embedded
      surface='transparent'
      items={[
        { label: 'Forsiden', href: '/' },
        { label: 'Inspirasjon', href: '/inspirasjon' },
        { label }
      ]}
    />
  )
}
