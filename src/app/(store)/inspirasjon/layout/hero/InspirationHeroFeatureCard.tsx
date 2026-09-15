import type { CSSProperties } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/className'
import type { InspirationHeroFeature } from './types'

interface InspirationHeroFeatureCardProps {
  feature: InspirationHeroFeature
}

export function InspirationHeroFeatureCard({
  feature
}: InspirationHeroFeatureCardProps) {
  const {
    title,
    description,
    icon: Icon,
    surface,
    border,
    shadow,
    marker,
    glow,
    sheen,
    iconSurface,
    iconColor,
    iconBorder,
    titleColor,
    descriptionColor,
    cardClassName,
    iconClassName,
    titleClassName,
    descriptionClassName
  } = feature

  const cardStyle: CSSProperties = {
    background: surface,
    borderColor: border,
    boxShadow: shadow
  }

  const iconBoxStyle: CSSProperties = {
    backgroundColor: iconSurface,
    borderColor: iconBorder ?? border,
    color: iconColor
  }

  return (
    <li>
      <Card
        className={cn(
          'group relative flex w-full flex-col overflow-hidden rounded-xl border py-0 text-foreground transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:aspect-2/1',
          cardClassName
        )}
        style={cardStyle}
      >
        {glow ?
          <div
            className='pointer-events-none absolute -inset-x-2 -inset-y-8 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20 motion-reduce:transition-none'
            style={{ background: glow }}
            aria-hidden='true'
          />
        : null}

        {sheen ?
          <div
            className='pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--foreground)_24%,transparent)_0%,color-mix(in_oklch,var(--foreground)_8%,transparent)_34%,transparent_100%)]'
            aria-hidden='true'
          />
        : null}

        {marker ?
          <span
            className='absolute inset-x-4 top-0 h-px transition-opacity duration-300 group-hover:opacity-70 motion-reduce:transition-none'
            style={{ background: marker }}
            aria-hidden='true'
          />
        : null}

        <CardContent className='relative flex h-full flex-col gap-3 p-5'>
          <div className='flex items-center gap-3'>
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg border',
                iconClassName
              )}
              style={iconBoxStyle}
              aria-hidden='true'
            >
              <Icon className='size-5' focusable='false' />
            </span>

            <h3
              className={cn(
                'inspirational-page-hero-card-heading whitespace-nowrap text-foreground',
                titleClassName
              )}
              style={
                titleColor ? { color: titleColor } : undefined
              }
            >
              {title}
            </h3>
          </div>

          <p
            className={cn(
              'inspirational-page-hero-card-description text-ancient-water pr-2',
              descriptionClassName
            )}
            style={
              descriptionColor ?
                { color: descriptionColor }
              : undefined
            }
          >
            {description}
          </p>
        </CardContent>
      </Card>
    </li>
  )
}
