// Path: src/components/frontpage/PreFooterNavigation.tsx
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import UtekosWordmark from '@/components/BrandComponents/utils/UtekosWordmark'
import { cn } from '@/lib/utils/className'
import { NavLinks } from './NavLinks'

type PreFooterNavigationProps = {
  variant?: 'default' | 'comfyrobe'
}

export function PreFooterNavigation({
  variant = 'default'
}: PreFooterNavigationProps) {
  const isComfyrobe = variant === 'comfyrobe'

  return (
    <section
      className={cn(
        'w-full max-w-full py-16 text-foreground md:py-24',
        isComfyrobe ? 'bg-jungle' : 'bg-night'
      )}
    >
      <div className='mx-auto max-w-5xl px-6'>
        <div className='mb-12 text-left'>
          <h2 className='leading-heading-level-two mb-4 font-sans font-utekos-text-medium text-5xl text-foreground md:text-6xl'>
            <span className='block'>Utforsk mer</span>
            <span className='flex items-baseline gap-3'>
              <span>
                av <span className='sr-only'>Utekos</span>
              </span>
              <UtekosWordmark
                aria-hidden
                className='h-[0.72em] w-auto translate-y-[0.04em] text-foreground'
              />
            </span>
          </h2>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {NavLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              className={cn(
                'group flex items-center justify-between p-6',
                'rounded-2xl border backdrop-blur-sm transition-all duration-400',
                isComfyrobe ?
                  'border-white/10 bg-jungle hover:border-primary/55 hover:bg-jungle/90 hover:shadow-lg hover:shadow-primary/5'
                : 'dark:border-dark-foreground/10 border-foreground/10 bg-jungle dark:hover:border-dark-primary/50 dark:hover:shadow-dark-primary/5 hover:border-secondary/50 hover:bg-jungle/90 hover:shadow-lg hover:shadow-secondary/5',
                index === 0 && 'md:col-span-2 lg:col-span-3',
                link.mdOnly && 'hidden md:flex'
              )}
            >
              <div className='flex items-center gap-4'>
                <div
                  className={cn(
                    'rounded-full border p-3 shadow-sm transition-colors duration-400',
                    isComfyrobe ?
                      'border-white/10 bg-background text-primary group-hover:border-primary/50 group-hover:bg-primary group-hover:text-background'
                    : 'border-border bg-muted text-primary group-hover:border-secondary/50 group-hover:bg-secondary group-hover:text-primary'
                  )}
                >
                  {link.icon}
                </div>

                <div className='flex flex-col'>
                  <span className='mb-0.5 font-sans text-xs font-medium tracking-widest text-primary uppercase transition-colors group-hover:text-primary'>
                    {link.description}
                  </span>
                  <span className='font-sans text-lg font-medium text-foreground transition-transform duration-300 group-hover:translate-x-1'>
                    {link.label}
                  </span>
                </div>
              </div>

              <ArrowRight className='size-5 text-primary transition-all duration-400 group-hover:translate-x-2 group-hover:text-primary' />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
