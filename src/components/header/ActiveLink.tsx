// Path: src/components/header/ActiveLink.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { navigationMenuTriggerStyle } from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils/className'

import type { Route } from 'next'
import type { ComponentProps } from 'react'

type ActiveLinkProps = Omit<
  ComponentProps<typeof Link>,
  'href'
> & { children: React.ReactNode; href: Route }

export function ActiveLink({
  href,
  className,
  children,
  ...props
}: ActiveLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        navigationMenuTriggerStyle(),
        'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
        className,
        isActive &&
          '-accent -accent-foreground bg-sidebar-accent text-sidebar-accent-foreground'
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
