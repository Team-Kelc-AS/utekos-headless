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
import type { Technology } from '../types'

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

export const TechnologyBlock = ({
  tech,
  isActive
}: {
  tech: Technology
  isActive: boolean
}) => {
  const IconComponent = iconMap[tech.icon]
  if (!IconComponent) return null

  return (
    <div
      className={cn(
        'relative rounded-2xl border border-transparent bg-jungle p-6 transition-all duration-500',
        isActive ?
          'border-card-foreground/10 text-card-foreground opacity-100 ring-1 ring-card-foreground/10 backdrop-blur-sm'
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
          {tech.title}
        </h3>
      </div>
      <div className='prose prose-invert mt-4 max-w-none'>
        <p className='leading-relaxed text-card-foreground/90'>
          {tech.content}
        </p>
        <div className='mt-4 flex flex-wrap gap-2'>
          {tech.products.map(product => (
            <span
              key={product}
              className={cn(
                'rounded-full border px-2.5 py-1 text-sm font-medium transition-colors',
                isActive ?
                  'border-card-foreground/20 bg-card-foreground/10 text-card-foreground'
                : 'border-border bg-transparent text-muted-foreground'
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
