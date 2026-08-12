import Link from 'next/link'
import type { Route } from 'next'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import {
  breadcrumbSurfaceStyles,
  isEmbeddedSurface,
  type BreadcrumbNavItem,
  type BreadcrumbSurface
} from '@/lib/navigation/breadcrumbVariants'
import { cn } from '@/lib/utils/className'

type UtekosBreadcrumbBarProps = {
  items: BreadcrumbNavItem[]
  surface: BreadcrumbSurface
  className?: string
  containerClassName?: string
  listClassName?: string
  embedded?: boolean
}

export function UtekosBreadcrumbBar({
  items,
  surface,
  className,
  containerClassName,
  listClassName,
  embedded
}: UtekosBreadcrumbBarProps) {
  const styles = breadcrumbSurfaceStyles[surface]
  const stripeless = isEmbeddedSurface(surface)
  const showColoredStripe =
    !embedded && !stripeless && Boolean(styles.stripe)

  const breadcrumb = (
    <Breadcrumb className={className}>
      <BreadcrumbList className={cn(styles.list, listClassName)}>
        {items.flatMap((item, index) => {
          const isLast = index === items.length - 1
          const nodes: React.ReactNode[] = []

          if (index > 0) {
            nodes.push(
              <BreadcrumbSeparator
                key={`breadcrumb-separator-${item.label}`}
                className={styles.separator}
              />
            )
          }

          nodes.push(
            <BreadcrumbItem
              key={`breadcrumb-item-${item.label}`}
            >
              {isLast || !item.href ?
                <BreadcrumbPage className={styles.page}>
                  {item.label}
                </BreadcrumbPage>
              : <BreadcrumbLink
                  className={styles.link}
                  render={<Link href={item.href as Route} />}
                >
                  {item.label}
                </BreadcrumbLink>
              }
            </BreadcrumbItem>
          )

          return nodes
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )

  if (embedded) {
    return breadcrumb
  }

  if (showColoredStripe) {
    return (
      <article className={cn('w-full', styles.stripe)}>
        <div
          className={cn(
            'container mx-auto w-full px-4 py-5',
            containerClassName
          )}
        >
          {breadcrumb}
        </div>
      </article>
    )
  }

  return (
    <div
      className={cn(
        'container mx-auto w-full px-4 py-5',
        containerClassName
      )}
    >
      {breadcrumb}
    </div>
  )
}
