import {
  Coffee,
  Maximize2,
  Move,
  type LucideIcon
} from 'lucide-react'
import type { ReactNode } from 'react'

type ExperienceMode = 'full-length' | 'adjusted' | 'parkas'

type ExperienceModeCardProps = {
  children: ReactNode
  mode: ExperienceMode
  subtitle: string
  title: string
}

type ModePresentation = { glow: string; icon: LucideIcon }

const MODE_PRESENTATION: Record<
  ExperienceMode,
  ModePresentation
> = {
  'full-length': { glow: 'from-secondary/10', icon: Maximize2 },
  'adjusted': { glow: 'from-primary/10', icon: Coffee },
  'parkas': { glow: 'from-accent/10', icon: Move }
}

export function ExperienceModeCard({
  children,
  mode,
  subtitle,
  title
}: ExperienceModeCardProps) {
  const { glow, icon: Icon } = MODE_PRESENTATION[mode]

  return (
    <article className='group relative snap-start overflow-hidden rounded-3xl border border-card-foreground/10 bg-jungle p-8 text-card-foreground ring-1 ring-card-foreground/12 backdrop-blur-xl transition-all duration-500 hover:border-foreground/20 hover:shadow-2xl'>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-linear-to-br ${glow} via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
      />

      <div className='relative z-10'>
        <div className='mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-card-foreground/10 text-card-foreground ring-1 ring-card-foreground/10'>
          <Icon className='h-6 w-6' aria-hidden />
        </div>
        <h3 className='mb-2 font-google-sans text-xl font-bold text-card-foreground'>
          {title}
        </h3>
        <p className='mb-4 font-google-sans text-sm font-bold tracking-wider text-card-foreground md:text-base'>
          {subtitle}
        </p>
        <div className='[&>p]:mt-2 [&>p]:font-utekos-text [&>p]:text-base [&>p]:leading-relaxed [&>p]:tracking-wide [&>p]:text-card-foreground/90 md:[&>p]:text-lg'>
          {children}
        </div>
      </div>
    </article>
  )
}
