import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'
import type { BreadcrumbNavItem } from '@/lib/navigation/breadcrumbVariants'

type KampanjeJulegaverBreadcrumbsProps = {
  currentLabel: string
  parentHref?: string
  parentLabel?: string
}

export function KampanjeJulegaverBreadcrumbs({
  currentLabel,
  parentHref,
  parentLabel
}: KampanjeJulegaverBreadcrumbsProps) {
  const items: BreadcrumbNavItem[] = [
    { label: 'Forsiden', href: '/' }
  ]

  if (parentHref && parentLabel) {
    items.push({ label: parentLabel, href: parentHref })
  }

  items.push({ label: currentLabel })

  return (
    <div className='container mx-auto px-4 pb-6 text-left'>
      <UtekosBreadcrumbBar
        embedded
        surface='transparent'
        className=' inline-flex rounded-full bg-card px-4 py-2 text-card-foreground shadow-sm ring-1 ring-border'
        items={items}
      />
    </div>
  )
}
