import Link from 'next/link'
import { BookOpen, ShoppingBag } from 'lucide-react'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { cn } from '@/lib/utils/className'

import type { Route } from 'next'
import type { ReactNode } from 'react'

const ctaCardClassName =
  'group relative flex flex-col items-center justify-center rounded-3xl border border-card-foreground/10 bg-card p-12 text-center text-card-foreground transition-all duration-500 hover:border-secondary/40 hover:bg-secondary hover:text-secondary-foreground hover:shadow-2xl'

const ctaIconClassName =
  'mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-card-foreground/10 text-card-foreground transition-all group-hover:scale-110 group-hover:bg-secondary-foreground group-hover:text-secondary'

type NavigationCtaCardProps = {
  children: ReactNode
  href: Route
  icon: 'book' | 'shop'
  title: string
  badgeLabel: string
}

const icons = { book: BookOpen, shop: ShoppingBag } as const

export function NavigationCtaCard({
  children,
  href,
  icon,
  title,
  badgeLabel
}: NavigationCtaCardProps) {
  const Icon = icons[icon]

  return (
    <Link href={href} className={ctaCardClassName}>
      <div className={ctaIconClassName}>
        <Icon className='h-8 w-8' aria-hidden />
      </div>
      <h3 className='mb-2 font-google-sans font-sans text-2xl font-bold text-card-foreground group-hover:text-secondary-foreground'>
        {title}
      </h3>
      <div className='mb-8 max-w-sm [&>p]:text-base [&>p]:text-card-foreground/90 group-hover:[&>p]:text-secondary-foreground/90'>
        {children}
      </div>
      <BrandBadge
        className={cn(
          'group-hover:bg-secondary-foreground group-hover:text-secondary'
        )}
      >
        {badgeLabel}
      </BrandBadge>
    </Link>
  )
}

export function NavigationCTA({
  children
}: {
  children: ReactNode
}) {
  return (
    <aside
      aria-label='Utforsk mer fra Utekos'
      className='mt-32 border-t border-border bg-muted py-24 text-foreground'
    >
      <div className='container mx-auto px-4'>
        <div className='grid gap-8 md:grid-cols-2'>
          {children}
        </div>
      </div>
    </aside>
  )
}
