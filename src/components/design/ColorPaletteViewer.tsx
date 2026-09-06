'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type {
  Color2ScaleFamily,
  Color2ScaleStep
} from '@/lib/brand/color-2-scales'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { cn } from '@/lib/utils/className'

type ColorFormat = 'hex' | 'oklch'

type ColorPaletteViewerProps = {
  families: Color2ScaleFamily[]
  source: string
  generatedAt: string
}

function formatLabel(value: ColorFormat) {
  return value === 'hex' ? 'HEX' : 'OKLCH'
}

function copyValue(step: Color2ScaleStep, format: ColorFormat) {
  return format === 'hex' ? step.hex : step.oklch
}

function ColorSwatch({
  familyId,
  step,
  format
}: {
  familyId: string
  step: Color2ScaleStep
  format: ColorFormat
}) {
  async function handleCopy() {
    const value = copyValue(step, format)

    try {
      await navigator.clipboard.writeText(value)
      toast.success(`Kopierte ${value}`)
    } catch {
      toast.error('Kunne ikke kopiere fargekoden')
    }
  }

  return (
    <button
      type='button'
      onClick={handleCopy}
      className='group flex min-w-0 flex-1 flex-col gap-2 text-left'
      aria-label={`Kopier ${familyId}-${step.shade} som ${formatLabel(format)}`}
    >
      <span
        className='aspect-[1.05] min-h-16 w-full rounded-md border border-foreground/10 transition group-hover:ring-2 group-hover:ring-foreground/30 group-focus-visible:ring-2 group-focus-visible:ring-foreground/50 sm:min-h-19 lg:min-h-20'
        style={{ backgroundColor: step.oklch }}
      />
      <span className='/55 truncate font-utekos-text text-xs text-foreground/55 group-hover:text-foreground/80'>
        {familyId}-{step.shade}
      </span>
    </button>
  )
}

function ColorScaleSection({
  family,
  format
}: {
  family: Color2ScaleFamily
  format: ColorFormat
}) {
  return (
    <article id={family.id} className='scroll-mt-16 space-y-4'>
      <div className='flex items-center justify-between gap-4'>
        <h2 className='text-lg font-medium tracking-tight text-foreground'>
          {family.title}
        </h2>
        <p className='/45 shrink-0 font-mono text-xs text-foreground/45'>
          Format: {formatLabel(format).toLowerCase()}
        </p>
      </div>

      <div className='grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11'>
        {family.steps.map(step => (
          <ColorSwatch
            key={step.token}
            familyId={family.id}
            step={step}
            format={format}
          />
        ))}
      </div>
    </article>
  )
}

export function ColorPaletteViewer({
  families,
  source,
  generatedAt
}: ColorPaletteViewerProps) {
  const [format, setFormat] = useState<ColorFormat>('hex')
  const generatedAtDisplay = generatedAt
    .replace('T', ' ')
    .slice(0, 16)

  return (
    <div className='space-y-10'>
      <header className='space-y-4 border-b border-foreground/10 pb-8'>
        <div className='flex flex-wrap items-end justify-between gap-4'>
          <div className='space-y-2'>
            <p className='font-utekos-text text-xs tracking-wide text-foreground/50'>
              <BrandBadge
                label='Utekos Brand'
                backgroundColor='var(--primary)'
                textColor='var(--foreground)'
              />
            </p>
            <h1 className='font-utekos-text-medium text-3xl tracking-tight text-foreground md:text-4xl'>
              Farger i alle formater
            </h1>
            <p className='/65 max-w-2xl text-sm leading-relaxed text-foreground/65'>
              Komplett palett fra{' '}
              <code className='/80 text-foreground/80'>
                {source}
              </code>
              . Klikk en farge for å kopiere{' '}
              <span className='/80 text-foreground/80'>HEX</span>{' '}
              eller{' '}
              <span className='/80 text-foreground/80'>
                OKLCH
              </span>
              .
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <span className='/55 text-sm text-foreground/55'>
              Format
            </span>
            <Select
              value={format}
              onValueChange={value => {
                if (value === 'hex' || value === 'oklch') {
                  setFormat(value)
                }
              }}
            >
              <SelectTrigger
                size='sm'
                className='w-38r-foreground/15 bg-foreground/5 text-foreground'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='border-foreground/15 bg-background text-foreground'>
                <SelectItem value='hex'>HEX</SelectItem>
                <SelectItem value='oklch'>OKLCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className='/45 font-utekos-text text-xs text-foreground/45'>
          {families.length} familier · synket{' '}
          {generatedAtDisplay}
        </p>
      </header>

      <nav
        aria-label='Fargefamilier'
        className='sticky top-0 z-20 -mx-1 overflow-x-auto border-b border-foreground/10 bg-background/95 px-1 py-3 backdrop-blur'
      >
        <ul className='flex min-w-max gap-2'>
          {families.map(family => (
            <li key={family.id}>
              <a
                href={`#${family.id}`}
                className={cn(
                  '/70 inline-flex rounded-full border border-foreground/10 px-3 py-1.5 text-xs text-foreground/70 transition-colors',
                  'hover:border-foreground/25 hover:bg-foreground/5 hover:text-foreground'
                )}
              >
                {family.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className='space-y-14 pb-16'>
        {families.map(family => (
          <ColorScaleSection
            key={family.id}
            family={family}
            format={format}
          />
        ))}
      </div>
    </div>
  )
}
