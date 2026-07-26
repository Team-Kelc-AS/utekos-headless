import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { cn } from '@/lib/utils/className'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Route } from 'next'

interface InspirationHeroActionStyle {
  backgroundColor: string
  textColor: string
  className: string
}

interface InspirationHeroActionsProps {
  primaryLabel: string
  secondaryLabel: string
  primaryStyle: InspirationHeroActionStyle
  secondaryStyle: InspirationHeroActionStyle
  primaryHref?: Route | string
  secondaryHref?: Route | string
}

export function InspirationHeroActions({
  primaryLabel,
  secondaryLabel,
  primaryStyle,
  secondaryStyle,
  primaryHref = '/produkter',
  secondaryHref = '#bruksomrader'
}: InspirationHeroActionsProps) {
  const baseClassName =
    'border px-7 py-3 text-base leading-4 font-utekos-text-medium tracking-[-0.01em] transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0'

  return (
    <>
      <BrandBadge
        asChild
        backgroundColor={primaryStyle.backgroundColor}
        textColor={primaryStyle.textColor}
        className={cn(
          'group',
          baseClassName,
          primaryStyle.className
        )}
      >
        <Link href={primaryHref as Route}>
          {primaryLabel}
          <ArrowRight className='ml-2 size-4 transition-transform group-hover:translate-x-1' />
        </Link>
      </BrandBadge>
      <BrandBadge
        asChild
        backgroundColor={secondaryStyle.backgroundColor}
        textColor={secondaryStyle.textColor}
        className={cn(baseClassName, secondaryStyle.className)}
      >
        <Link href={secondaryHref as Route}>
          {secondaryLabel}
        </Link>
      </BrandBadge>
    </>
  )
}
