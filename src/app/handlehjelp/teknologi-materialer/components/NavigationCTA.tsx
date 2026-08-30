import Link from 'next/link'
import { BookOpen, ShoppingBag } from 'lucide-react'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { cn } from '@/lib/utils/className'

import type { Route } from 'next'

const ctaCardClassName =
  'group relative flex flex-col items-center justify-center rounded-3xl border border-card-foreground/10 bg-jungle p-12 text-center text-card-foreground transition-all duration-500 hover:border-secondary/40 hover:bg-secondary hover:text-secondary-foreground hover:shadow-2xl'

const ctaIconClassName =
  'mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-card-foreground/10 text-card-foreground transition-all group-hover:scale-110 group-hover:bg-secondary-foreground group-hover:text-secondary'

type NavigationCtaCardProps = {
  href: Route
  icon: typeof ShoppingBag
  title: string
  description: string
  badgeLabel: string
}

function NavigationCtaCard({
  href,
  icon: Icon,
  title,
  description,
  badgeLabel
}: NavigationCtaCardProps) {
  return (
    <Link href={href} className={ctaCardClassName}>
      <div className={ctaIconClassName}>
        <Icon className='h-8 w-8' aria-hidden />
      </div>
      <h3 className='mb-2 font-sans text-2xl font-bold text-card-foreground group-hover:text-secondary-foreground'>
        {title}
      </h3>
      <p className='mb-8 max-w-sm text-card-foreground/90 group-hover:text-secondary-foreground/90'>
        {description}
      </p>
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

export function NavigationCTA() {
  return (
    <article className='mt-32 font-sans border-t border-border bg-night py-24 text-foreground'>
      <div className='container mx-auto px-4'>
        <div className='grid gap-8 md:grid-cols-2'>
          <NavigationCtaCard
            href='/produkter'
            icon={ShoppingBag}
            title='Utforsk kolleksjonen'
            description='Klar for å oppleve Utekos®? Se vårt utvalg.'
            badgeLabel='Gå til butikken'
          />
          <NavigationCtaCard
            href='/magasinet'
            icon={BookOpen}
            title='Inspirasjon og historier'
            description='Les mer om tips og historier i vårt magasin.'
            badgeLabel='Les magasinet'
          />
        </div>
      </div>
    </article>
  )
}
