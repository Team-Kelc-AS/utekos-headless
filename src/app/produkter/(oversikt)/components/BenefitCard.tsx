// Path: src/app/produkter/(oversikt)/components/BenefitCard.tsx

'use client'

import { Check } from 'lucide-react'
import type { CSSProperties } from 'react'

type BenefitSurface = 'dazzle' | 'orange' | 'dazzleagain'

interface Benefit {
  label: string
  description: string
  glowColor: string
  surface?: BenefitSurface
}

interface BenefitCardProps {
  benefit: Benefit
  delay: number
}

const surfaceStyles: Record<
  BenefitSurface,
  {
    background: string
    borderColor: string
    textColor: string
    descriptionColor: string
    iconColor?: string
  }
> = {
  dazzle: {
    background: 'var(--card)',
    borderColor: 'var(--border)',
    textColor: 'var(--card-foreground)',
    descriptionColor: 'var(--card-foreground)',
    iconColor: 'var(--sidebar-primary-foreground)'
  },
  orange: {
    background: 'var(--promo)',
    borderColor:
      'color-mix(in oklch, var(--promo-foreground) 28%, transparent)',
    textColor: 'var(--promo-foreground)',
    descriptionColor: 'var(--promo-foreground)'
  },
  dazzleagain: {
    background: 'var(--card)',
    borderColor: 'var(--border)',
    textColor: 'var(--card-foreground)',
    descriptionColor: 'var(--card-foreground)',
    iconColor: 'var(--sidebar-primary-foreground)'
  }
}

export function BenefitCard({
  benefit,
  delay
}: BenefitCardProps) {
  const surface = surfaceStyles[benefit.surface ?? 'orange']

  return (
    <li
      className='animate-fade-in-on-scroll group relative overflow-hidden rounded-[1.05rem] border shadow-[0_18px_44px_-36px_color-mix(in_oklch,var(--background)_82%,transparent)] transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0'
      style={
        {
          '--animation-delay': `${delay}s`,
          '--benefit-accent': benefit.glowColor,
          'borderColor': surface.borderColor,
          'background': surface.background
        } as CSSProperties
      }
    >
      <div
        className='pointer-events-none absolute -inset-x-8 -top-20 h-44 opacity-[0.14] blur-3xl transition-opacity duration-300 group-hover:opacity-[0.22]'
        style={{
          background:
            'radial-gradient(120% 120% at 50% 0%, transparent 38%, var(--benefit-accent) 100%)'
        }}
      />

      <div className='relative z-10 flex min-h-[3.75rem] items-center gap-3 px-4 py-3.5'>
        <div
          className='flex size-8 shrink-0 items-center justify-center rounded-lg border transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none'
          style={{
            borderColor: 'var(--sidebar-primary)',
            background: 'var(--sidebar-primary)'
          }}
        >
          <Check
            className='size-5'
            style={{
              color:
                surface.iconColor ??
                'var(--sidebar-primary-foreground)'
            }}
            aria-hidden='true'
          />
        </div>

        <div className='flex-1'>
          <span
            className='font-utekos-text-medium'
            style={{ color: surface.textColor }}
          >
            {benefit.label}
          </span>
          {benefit.description && (
            <span style={{ color: surface.descriptionColor }}>
              {' '}
              {benefit.description}
            </span>
          )}
        </div>
      </div>
    </li>
  )
}
