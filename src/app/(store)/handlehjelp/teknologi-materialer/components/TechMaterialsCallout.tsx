import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/className'

export const TECH_MATERIALS_CALLOUT_TONES = [
  'note',
  'spec',
  'applies',
  'quote'
] as const

export type TechMaterialsCalloutTone =
  (typeof TECH_MATERIALS_CALLOUT_TONES)[number]

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
    label: 'Sitat',
    className: 'border-primary/30 bg-jungle'
  }
} as const satisfies Record<
  TechMaterialsCalloutTone,
  { label: string; className: string }
>

function calloutPresentation(tone: TechMaterialsCalloutTone) {
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

export function TechMaterialsCallout({
  tone,
  children
}: {
  tone: TechMaterialsCalloutTone
  children: ReactNode
}) {
  const presentation = calloutPresentation(tone)

  return (
    <aside
      data-callout-tone={tone}
      className={cn(
        'my-6 rounded-xl border px-5 py-4 text-foreground',
        presentation.className
      )}
    >
      <p className='mb-2 font-utekos-text-medium text-sm tracking-wide text-primary'>
        {presentation.label}
      </p>
      <div className='font-utekos-text text-[0.95rem] leading-relaxed [&_p]:mt-0 [&_p]:max-w-none'>
        {children}
      </div>
    </aside>
  )
}
