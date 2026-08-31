import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/className'

export const SIZE_GUIDE_CALLOUT_TONES = [
  'note',
  'spec',
  'applies',
  'quote'
] as const

export type SizeGuideCalloutTone =
  (typeof SIZE_GUIDE_CALLOUT_TONES)[number]

const calloutByTone = {
  note: {
    label: 'Merk',
    className: 'border-secondary/35 bg-jungle'
  },
  spec: {
    label: 'Spesifikasjon',
    className: 'border-primary/40 bg-jungle'
  },
  applies: {
    label: 'Gjelder',
    className: 'border-foreground/15 bg-jungle'
  },
  quote: {
    label: 'Tips',
    className: 'border-primary/30 bg-jungle'
  }
} as const satisfies Record<
  SizeGuideCalloutTone,
  { label: string; className: string }
>

function calloutPresentation(tone: SizeGuideCalloutTone) {
  switch (tone) {
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

export function SizeGuideCallout({
  tone,
  children
}: {
  tone: SizeGuideCalloutTone
  children: ReactNode
}) {
  const presentation = calloutPresentation(tone)

  return (
    <aside
      data-callout-tone={tone}
      className={cn(
        'my-5 rounded-xl border px-4 py-3.5 text-foreground sm:px-5 sm:py-4',
        presentation.className
      )}
    >
      <p className='mb-1.5 font-sans text-xs font-semibold tracking-wide text-primary uppercase'>
        {presentation.label}
      </p>
      <div className='font-sans text-sm leading-relaxed text-foreground [&_p]:mt-0 [&_p]:max-w-none [&_strong]:font-semibold'>
        {children}
      </div>
    </aside>
  )
}
