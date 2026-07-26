import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  CloudRain,
  Feather,
  Gift,
  ShieldCheck
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/className'
import { H3 } from '@/components/typography/TypographyH3'
import { P } from '@/components/typography/TypographyP'

const iconMap = {
  'cloud-rain': CloudRain,
  'feather': Feather,
  'shield-check': ShieldCheck,
  'gift': Gift
} as const satisfies Record<string, LucideIcon>

export interface Feature {
  icon: keyof typeof iconMap
  title: string
  description: string
}

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description?: string
  children?: ReactNode
  className?: string
  contentClassName?: string
  iconWrapClassName?: string
  iconClassName?: string
  titleClassName?: string
  descriptionClassName?: string
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  children,
  className,
  contentClassName,
  iconWrapClassName,
  iconClassName,
  titleClassName,
  descriptionClassName
}: FeatureCardProps) {
  return (
    <Card
      className={cn(
        'w-full overflow-hidden rounded-2xl bg-card p-0 text-card-foreground shadow-none dark:bg-badge dark:text-foreground',
        className
      )}
    >
      <CardContent
        className={cn(
          'grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 p-4 sm:gap-4 sm:p-5',
          contentClassName
        )}
      >
        <span
          className={cn(
            'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-badge text-secondary-foreground sm:size-11 dark:bg-card',
            iconWrapClassName
          )}
        >
          <Icon
            aria-hidden='true'
            focusable='false'
            strokeWidth={1.8}
            className={cn('size-5 sm:size-5.5', iconClassName)}
          />
        </span>

        <div className='min-w-0'>
          <H3
            className={cn(
              'm-0 pb-0 font-utekos-text-medium text-lg leading-tight tracking-normal text-balance wrap-break-word text-card-foreground sm:text-xl lg:text-2xl',
              titleClassName
            )}
          >
            {title}
          </H3>

          {description ?
            <P
              className={cn(
                '/86 mt-1.5 max-w-prose text-sm leading-relaxed text-pretty wrap-break-word text-card-foreground/86 not-first:mt-0 sm:mt-2 sm:text-base',
                descriptionClassName
              )}
            >
              {description}
            </P>
          : null}

          {children ?
            <div className='mt-4'>{children}</div>
          : null}
        </div>
      </CardContent>
    </Card>
  )
}

interface TechDownFeatureCardProps {
  feature: Feature
  className?: string
  contentClassName?: string
  iconWrapClassName?: string
  iconClassName?: string
  titleClassName?: string
  descriptionClassName?: string
}

export function TechDownFeatureCard({
  feature,
  ...props
}: TechDownFeatureCardProps) {
  const Icon = iconMap[feature.icon]

  return (
    <FeatureCard
      icon={Icon}
      title={feature.title}
      description={feature.description}
      {...props}
    />
  )
}
