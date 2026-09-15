import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils/className'
import type { InspirationHeroAlign } from './types'

interface InspirationHeroHeadingProps {
  id: string
  title: ReactNode
  lead: ReactNode
  align?: InspirationHeroAlign
  titleColor?: string
  leadColor?: string
  titleClassName?: string
  leadClassName?: string
}

export function InspirationHeroHeading({
  id,
  title,
  lead,
  align = 'left',
  titleColor,
  leadColor,
  titleClassName,
  leadClassName
}: InspirationHeroHeadingProps) {
  const titleStyle: CSSProperties | undefined =
    titleColor ? { color: titleColor } : undefined
  const leadStyle: CSSProperties | undefined =
    leadColor ? { color: leadColor } : undefined

  return (
    <hgroup>
      <h1
        id={id}
        className={cn(
          'text-foreground max-md:text-balance md:text-nowrap',
          align === 'center' ?
            'mx-auto text-center'
          : 'mx-0 text-left',
          titleClassName
        )}
        style={titleStyle}
      >
        {title}
      </h1>

      <p
        className={cn(
          'font-utekos-text-medium mt-10 max-w-4xl text-3xl leading-10 tracking-wide text-foreground sm:mt-12',
          align === 'center' ?
            'mx-auto text-center'
          : 'text-left',
          leadClassName
        )}
        style={leadStyle}
      >
        {lead}
      </p>
    </hgroup>
  )
}
