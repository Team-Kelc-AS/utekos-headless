import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/className'

export const TECH_MATERIALS_CALLOUT_TONES = [
  'highlight',
  'note',
  'spec',
  'applies',
  'quote'
] as const

export type TechMaterialsCalloutTone =
  (typeof TECH_MATERIALS_CALLOUT_TONES)[number]

const calloutByTone = {
  highlight: {
    label: 'Kort fortalt',
    shellClassName: 'bg-primary/20 ring-primary/45',
    panelClassName: 'bg-primary text-primary-foreground',
    labelClassName: 'text-primary-foreground',
    bodyClassName: 'text-primary-foreground'
  },
  note: {
    label: 'Verdt å vite',
    shellClassName: 'bg-foreground/7 ring-foreground/14',
    panelClassName: 'bg-background text-foreground',
    labelClassName: 'text-primary',
    bodyClassName: 'text-foreground'
  },
  spec: {
    label: 'Spesifikasjon',
    shellClassName: 'bg-primary/18 ring-primary/45',
    panelClassName: 'bg-background text-foreground',
    labelClassName: 'text-primary',
    bodyClassName: 'text-foreground'
  },
  applies: {
    label: 'Gjelder',
    shellClassName: 'bg-foreground/5 ring-foreground/12',
    panelClassName:
      'bg-background/85 text-foreground md:flex md:items-baseline md:gap-4',
    labelClassName: 'text-primary md:mb-0 md:shrink-0',
    bodyClassName: 'text-foreground'
  },
  quote: {
    label: 'I praksis',
    shellClassName: 'bg-primary/14 ring-primary/35',
    panelClassName: 'bg-jungle text-foreground',
    labelClassName: 'text-primary',
    bodyClassName: 'text-foreground'
  }
} as const satisfies Record<
  TechMaterialsCalloutTone,
  {
    label: string
    shellClassName: string
    panelClassName: string
    labelClassName: string
    bodyClassName: string
  }
>

function calloutPresentation(tone: TechMaterialsCalloutTone) {
  switch (tone) {
    case 'highlight':
      return calloutByTone.highlight
    case 'note':
      return calloutByTone.note
    case 'spec':
      return calloutByTone.spec
    case 'applies':
      return calloutByTone.applies
    case 'quote':
      return calloutByTone.quote
    default: {
      const exhaustive: never = tone
      throw new Error(`Ukjent callout-tone: ${exhaustive}`)
    }
  }
}

export function TechMaterialsCallout({
  tone,
  title,
  children
}: {
  tone: TechMaterialsCalloutTone
  title?: string
  children: ReactNode
}) {
  const presentation = calloutPresentation(tone)

  return (
    <aside
      data-callout-tone={tone}
      className={cn(
        'my-7 rounded-2xl p-1 ring-1 ring-inset',
        presentation.shellClassName
      )}
    >
      <div
        className={cn(
          'rounded-xl px-5 py-5 md:px-6',
          presentation.panelClassName
        )}
      >
        <p
          className={cn(
            'mb-2 font-sans text-sm font-extrabold',
            presentation.labelClassName
          )}
        >
          {title ?? presentation.label}
        </p>
        <div
          className={cn(
            'font-sans text-[1.0625rem] leading-[1.7] font-medium md:text-lg [&_p]:mt-0 [&_p]:max-w-none',
            presentation.bodyClassName
          )}
        >
          {children}
        </div>
      </div>
    </aside>
  )
}
