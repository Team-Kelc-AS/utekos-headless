// Path: src/components/frontpage/PreFooterNavigation.tsx
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import UtekosWordmark from '@/components/BrandComponents/utils/UtekosWordmark'
import { cn } from '@/lib/utils/className'
import { NavLinks } from './NavLinks'

export function PreFooterNavigation() {
  return (
    // Gradient-bakgrunnen blender sømløst over fra trekkspillet over, og ned i footeren under
    <section className='dark:from-dark-background dark:to-dark-card w-full max-w-full bg-linear-to-b from-background to-card py-16 text-foreground md:py-24'>
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
              className={cn(
                'group flex items-center justify-between p-6',
                'dark:border-dark-foreground/10 dark:bg-dark-background/30 rounded-2xl border border-foreground/10 bg-background/30 backdrop-blur-sm',
                'dark:hover:border-dark-primary/50 dark:hover:bg-dark-background/60 dark:hover:shadow-dark-primary/5 transition-all duration-400 hover:border-secondary/50 hover:bg-background/60 hover:shadow-lg hover:shadow-secondary/5',
                index === 0 && 'md:col-span-2 lg:col-span-3',
                link.mdOnly && 'hidden md:flex'
              )}
            >
              <div className='flex items-center gap-4'>
                <div
                  className={cn(
                    'rounded-full border border-border bg-muted p-3 text-ceramic shadow-sm transition-colors duration-400',
                    'group-hover:border-secondary/50 group-hover:bg-secondary group-hover:text-secondary-foreground'
                  )}
                >
                  {link.icon}
                </div>

                <div className='flex flex-col'>
                  <span className='/50 dark:group-hover:text-dark-foreground/90 mb-0.5 font-sans text-xs font-medium tracking-widest text-foreground/50 uppercase transition-colors group-hover:text-foreground/90'>
                    {link.description}
                  </span>
                  <span className='font-sans text-lg font-medium text-foreground transition-transform duration-300 group-hover:translate-x-1'>
                    {link.label}
                  </span>
                </div>
              </div>

              <ArrowRight className='size-5 text-muted-foreground transition-all duration-400 group-hover:translate-x-2 group-hover:text-ceramic' />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
