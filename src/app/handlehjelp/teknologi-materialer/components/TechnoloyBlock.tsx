'use client'

import {
  Cloud,
  Feather,
  Flame,
  Gem,
  Layers,
  Shield,
  Thermometer,
  Weight,
  Droplet,
  Sun,
  Zap,
  Maximize2,
  Wind,
  Shirt
} from 'lucide-react'
import { cn } from '@/lib/utils/className'
import { useActiveTechnology } from './ProductSpecsView'
import type { ReactNode } from 'react'

const iconMap: { [key: string]: React.ElementType } = {
  'thermometer': Thermometer,
  'feather': Feather,
  'weight': Weight,
  'gem': Gem,
  'shield': Shield,
  'layers': Layers,
  'flame': Flame,
  'cloud': Cloud,
  'droplet': Droplet,
  'sun': Sun,
  'zap': Zap,
  'wind': Wind,
  'maximize-2': Maximize2,
  'shirt': Shirt
}

const productBadgeClassNames: Record<string, string> = {
  'Utekos TechDown™':
    'border-transparent bg-dark-teal text-foreground',
  'Utekos Dun™': 'border-transparent bg-muted text-foreground',
  'Utekos Mikrofiber™':
    'border-transparent bg-green-haze text-foreground'
}

export const TechnologyBlock = ({
  children,
  icon,
  products,
  title
}: {
  children: ReactNode
  icon: string
  products: readonly string[]
  title: string
}) => {
  const activeTechnology = useActiveTechnology()
  const isActive = activeTechnology === title
  const IconComponent = iconMap[icon]
  if (!IconComponent) return null

  return (
    <div
      data-tech-title={title}
      className={cn(
        'relative rounded-2xl border border-transparent bg-jungle p-6 text-card-foreground transition-all duration-500',
        isActive ?
          'border-card-foreground/10 opacity-100 ring-1 ring-card-foreground/10 backdrop-blur-sm'
        : 'opacity-40 hover:opacity-65'
      )}
    >
      <div className='flex items-center gap-4'>
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors',
            isActive ?
              'border-card-foreground/30 bg-card-foreground/10 text-card-foreground'
            : 'border-border bg-muted text-muted-foreground'
          )}
        >
          <IconComponent className='h-6 w-6' aria-hidden />
        </div>
        <h3
          className={cn(
            'font-google-sans text-xl font-bold transition-colors',
            isActive ?
              'text-card-foreground'
            : 'text-muted-foreground'
          )}
        >
          {title}
        </h3>
      </div>
      <div className='prose prose-invert mt-4 max-w-none [&>p]:leading-relaxed [&>p]:text-card-foreground/90'>
        {children}
        <div className='mt-4 flex flex-wrap gap-2'>
          {products.map(product => (
            <span
              key={product}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                productBadgeClassNames[product] ??
                  'border-card-foreground/20 bg-jungle-tone text-card-foreground'
              )}
            >
              {product}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
