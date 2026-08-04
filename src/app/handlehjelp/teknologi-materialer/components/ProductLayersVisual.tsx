'use client'

import { cn } from '@/lib/utils/className'
import {
  Droplet,
  Thermometer,
  Sparkles,
  ShieldCheck,
  Zap,
  type LucideIcon
} from 'lucide-react'
import carbonFibre from '@/assets/images/textures/carbon-fibre.png'


type LayerType = 'outer' | 'insulation' | 'inner' | 'function'

type LayerThemeKey = 'secondary' | 'foreground' | 'primary'

type LayerTheme = {
  border: string
  bg: string
  text: string
  glow: string
  gradient: string
  indicator: string
}

const LAYER_THEMES: Record<LayerThemeKey, LayerTheme> = {
  secondary: {
    border: 'border-secondary/30',
    bg: 'bg-card',
    text: 'text-secondary',
    glow: 'shadow-secondary/20',
    gradient: 'from-secondary/10',
    indicator: 'bg-secondary'
  },
  foreground: {
    border: 'border-foreground/30',
    bg: 'bg-card',
    text: 'text-card-foreground',
    glow: 'shadow-foreground/20',
    gradient: 'from-foreground/10',
    indicator: 'bg-card-foreground'
  },
  primary: {
    border: 'border-primary/30',
    bg: 'bg-card',
    text: 'text-primary',
    glow: 'shadow-primary/20',
    gradient: 'from-primary/10',
    indicator: 'bg-primary'
  }
}

const getLayerType = (title: string): LayerType => {
  const t = title.toLowerCase()
  if (
    t.includes('3-i-1') ||
    t.includes('zip') ||
    t.includes('konstruksjon')
  ) {
    return 'function'
  }
  if (
    t.includes('innerfôr') ||
    t.includes('taffeta') ||
    t.includes('sherpa') ||
    t.includes('lining')
  ) {
    return 'inner'
  }
  if (
    t.includes('insulation') ||
    t.includes('dun') ||
    t.includes('fiber') ||
    t.includes('fillpower') ||
    t.includes('cloudweave')
  ) {
    return 'insulation'
  }
  return 'outer'
}

export function ProductLayersVisual({
  activeTech
}: {
  activeTech: string
}) {
  const activeLayer = getLayerType(activeTech)

  return (
    <div className='relative flex h-[60vh] w-full items-center justify-center p-8'>
      <div className='absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--foreground)_5%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_5%,transparent)_1px,transparent_1px)] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_90%,transparent_100%)] bg-size-[24px_24px]' />

      <div className='relative flex w-full max-w-sm flex-col gap-4 perspective-[1000px]'>
        <MaterialCard
          isActive={activeLayer === 'outer'}
          title='Protective Shell'
          subtitle='Værbarriere og slitestyrke'
          icon={ShieldCheck}
          theme={LAYER_THEMES.secondary}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: `url(${carbonFibre.src})` }}
          />
          <div className='absolute top-4 right-4 animate-pulse text-secondary opacity-50'>
            <Droplet className='h-5 w-5' aria-hidden />
          </div>
        </MaterialCard>

        <MaterialCard
          isActive={activeLayer === 'insulation'}
          title='Thermal Core'
          subtitle='Varme og loft'
          icon={Thermometer}
          theme={LAYER_THEMES.foreground}
        >
          <div className='absolute inset-0 bg-linear-to-br from-foreground/10 via-transparent to-transparent' />
        </MaterialCard>

        <MaterialCard
          isActive={activeLayer === 'inner'}
          title='Comfort Lining'
          subtitle='Pustende og myk'
          icon={Sparkles}
          theme={LAYER_THEMES.primary}
        >
          <div className='absolute inset-0 skew-x-12 bg-linear-to-r from-transparent via-primary/10 to-transparent' />
        </MaterialCard>

        <div
          className={cn(
            'absolute top-1/2 -right-12 -translate-y-1/2 transition-all duration-900',
            activeLayer === 'function' ?
              'translate-x-0 opacity-100'
            : 'pointer-events-none translate-x-8 opacity-0'
          )}
        >
          <div className='flex flex-col items-center gap-2 rounded-xl border border-secondary/30 bg-card/90 p-4 text-card-foreground shadow-2xl backdrop-blur-md'>
            <div className='rounded-full bg-secondary/20 p-2 text-secondary'>
              <Zap className='h-6 w-6' aria-hidden />
            </div>
            <div className='font-google-sans text-sm font-bold tracking-wider text-secondary'>
              System
            </div>
            <div className='h-16 w-0.5 bg-linear-to-b from-secondary/50 to-transparent' />
          </div>
        </div>
      </div>
    </div>
  )
}

export function MobileProductLayersVisual({
  activeTech
}: {
  activeTech: string
}) {
  const activeLayer = getLayerType(activeTech)

  const layerData = {
    outer: {
      title: 'Outer Shell',
      icon: ShieldCheck,
      theme: LAYER_THEMES.secondary,
      index: 0
    },
    insulation: {
      title: 'Thermal Core',
      icon: Thermometer,
      theme: LAYER_THEMES.foreground,
      index: 1
    },
    inner: {
      title: 'Comfort Lining',
      icon: Sparkles,
      theme: LAYER_THEMES.primary,
      index: 2
    },
    function: {
      title: 'System Tech',
      icon: Zap,
      theme: LAYER_THEMES.secondary,
      index: 3
    }
  } as const

  const current = layerData[activeLayer]
  const theme = current.theme

  return (
    <div className='animate-slide-in-up fixed right-4 bottom-6 left-4 z-50'>
      <div
        className={cn(
          'relative flex items-center gap-4 overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-500',
          theme.border,
          theme.bg,
          theme.glow
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-linear-to-r to-transparent opacity-20',
            theme.gradient
          )}
        />

        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-card-foreground/10 backdrop-blur-md transition-colors',
            theme.border,
            theme.text
          )}
        >
          <current.icon className='h-6 w-6' aria-hidden />
        </div>

        <div className='min-w-0 flex-1'>
          <div
            className={cn(
              'font-google-sans text-sm font-bold tracking-widest',
              theme.text
            )}
          >
            Active Layer
          </div>
          <div className='font-google-sans truncate text-lg font-bold text-card-foreground'>
            {current.title}
          </div>
        </div>

        <div className='flex flex-col gap-1 opacity-50'>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={cn(
                'h-1.5 w-1.5 rounded-full transition-all duration-300',
                current.index === i ?
                  'scale-125 bg-card-foreground'
                : 'bg-card-foreground/20'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function MaterialCard({
  isActive,
  title,
  subtitle,
  icon: Icon,
  theme,
  children
}: {
  isActive: boolean
  title: string
  subtitle: string
  icon: LucideIcon
  theme: LayerTheme
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'relative flex items-center gap-6 overflow-hidden rounded-2xl border p-6 backdrop-blur-sm transition-all duration-500 ease-out',
        'border-card-foreground/10 bg-card/80',
        isActive ?
          cn(
            'z-10 translate-y-0 scale-105 opacity-100 shadow-2xl',
            theme.border,
            theme.glow
          )
        : 'z-0 scale-95 opacity-40 grayscale-[0.5] hover:opacity-60'
      )}
    >
      <div
        className={cn(
          'absolute top-0 bottom-0 left-0 w-1 transition-all duration-500',
          isActive ? theme.indicator : 'bg-transparent'
        )}
      />

      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300',
          isActive ?
            cn(theme.border, 'bg-card-foreground/10', theme.text)
          : 'border-card-foreground/10 bg-muted text-muted-foreground'
        )}
      >
        <Icon className='h-6 w-6' aria-hidden />
      </div>

      <div className='flex flex-col'>
        <span
          className={cn(
            'font-google-sans text-xs font-bold tracking-widest uppercase transition-colors',
            isActive ? theme.text : 'text-muted-foreground'
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            'font-utekos-text-medium text-lg transition-colors',
            isActive ?
              'text-card-foreground'
            : 'text-muted-foreground'
          )}
        >
          {subtitle}
        </span>
      </div>
      {children}
    </div>
  )
}
