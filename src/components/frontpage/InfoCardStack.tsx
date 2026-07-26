import { cn } from '@/lib/utils/className'
import { Lock, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import UtekosLogo from '@public/icon.png'

const TrafficLights = ({
  variant = 'default'
}: {
  variant?: 'default' | 'colored'
}) => {
  const colors =
    variant === 'colored' ?
      ['bg-red-500/80', 'bg-blue-500/80', 'bg-green-500/80']
    : [
        'bg-sidebar-foreground -foreground',
        'bg-sidebar-foreground -foreground',
        'bg-sidebar-foreground -foreground'
      ]

  return (
    <div className='absolute top-3 left-3 z-20 flex gap-1.5'>
      {colors.map((color, i) => (
        <div
          key={i}
          className={cn('h-2 w-2 rounded-full', color)}
        />
      ))}
    </div>
  )
}

export function InfoCardStack() {
  const cardBaseClasses =
    'absolute w-full rounded-lg border border-neutral-800 shadow-xl transition-all duration-300'

  return (
    <div className='relative h-72 w-full overflow-visible sm:h-80'>
      <div
        className={cn(
          cardBaseClasses,
          'dark:bg-dark-secondary dark:text-dark-secondary-foreground top-0 left-0 bg-secondary text-secondary-foreground',
          'h-40 max-w-70 sm:h-48 sm:max-w-sm',
          'p-4 sm:p-6'
        )}
      >
        <TrafficLights variant='default' />
        <div className='mt-6 flex items-start gap-3'>
          <ShoppingBag className='dark:text-dark-secondary-foreground h-4 w-4 shrink-0 text-secondary-foreground sm:h-5 sm:w-5' />
          <div>
            <h3 className='dark:text-dark-secondary-foreground font-utekos-text-medium text-sm text-secondary-foreground sm:text-base'>
              En trygg handel
            </h3>
            <p className='dark:text-dark-secondary-foreground/85 mt-1 text-xs text-secondary-foreground/85 sm:text-sm'>
              Sikre betalingsløsninger og 14 dagers angrerett.
            </p>
          </div>
        </div>
      </div>
      <div
        className={cn(
          cardBaseClasses,
          'dark:bg-dark-primary overflow-hidden bg-primary text-primary-foreground',
          'h-40 max-w-70 sm:h-48 sm:max-w-sm',
          'p-4 sm:p-6',
          'top-28 left-12 sm:top-32 sm:left-1/4'
        )}
      >
        <div
          className='absolute inset-0 z-0 opacity-20'
          style={{
            backgroundImage: `
              repeating-linear-gradient(to right, var(--color-border), var(--color-border) 1px, transparent 1px, transparent 40px),
              repeating-linear-gradient(to bottom, var(--color-border), var(--color-border) 1px, transparent 1px, transparent 40px)
            `,
            maskImage:
              'linear-gradient(to bottom, white 0%, white 70%, transparent 100%)'
          }}
        />

        <TrafficLights variant='colored' />

        <div className='relative z-10 flex h-full flex-col'>
          <div className='mt-6 flex items-start gap-3'>
            <Lock className='h-4 w-4 shrink-0 text-primary-foreground sm:h-5 sm:w-5' />
            <div>
              <h3 className='font-utekos-text-medium text-sm text-primary-foreground sm:text-base'>
                Ditt personvern
              </h3>
              <p className='/85 mt-1 text-xs text-primary-foreground/85 sm:text-sm'>
                Vi tar personvern på alvor. Se hvordan vi
                behandler dine data.
              </p>
            </div>
          </div>

          <div className='mt-auto flex justify-center pt-2 pb-1'>
            <Image
              src={UtekosLogo}
              alt='Utekos logo ikon'
              className='h-6 w-6 opacity-50 sm:h-8 sm:w-8'
            />
          </div>
        </div>
      </div>
    </div>
  )
}
