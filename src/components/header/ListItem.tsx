// Path: src/components/header/ListItem.tsx
import Link from 'next/link'
import * as React from 'react'

import { NavigationMenuLink } from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils/className'

import type { Route } from 'next'
import type { ComponentRef } from 'react'

export const ListItem = React.forwardRef<
  ComponentRef<typeof Link>,
  Omit<React.ComponentPropsWithoutRef<typeof Link>, 'href'> & {
    title: string
    href: Route
  }
>(({ className, title, href, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink
        render={<Link ref={ref} href={href} {...props} />}
        className={cn(
          'block space-y-1 rounded-xl border border-transparent p-3 leading-none no-underline transition-colors outline-none select-none hover:border-foreground/10 hover:bg-foreground/7 focus-visible:border-foreground/18 focus-visible:bg-foreground/8 focus-visible:ring-2 focus-visible:ring-foreground/35',
          className
        )}
      >
        <div className='font-utekos-text-medium text-[0.9375rem] leading-4 tracking-[0.01em] text-foreground'>
          {title}
        </div>
        {children && (
          <p className='leading-text-paragraph /80 line-clamp-2 text-sm tracking-[0.01em] text-foreground/80'>
            {children}
          </p>
        )}
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = 'ListItem'
