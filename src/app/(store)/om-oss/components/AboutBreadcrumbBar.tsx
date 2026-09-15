import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'
import type { BreadcrumbNavItem } from '@/lib/navigation/breadcrumbVariants'

type AboutBreadcrumbBarProps = {
  items: Array<{ name: string; path: string }>
}

export function AboutBreadcrumbBar({
  items
}: AboutBreadcrumbBarProps) {
  const breadcrumbItems: BreadcrumbNavItem[] = items.map(
    (item, index) => ({
      label: item.name,
      ...(index < items.length - 1 ? { href: item.path } : {})
    })
  )

  return (
    <UtekosBreadcrumbBar
      surface='transparent'
      items={breadcrumbItems}
    />
  )
}
