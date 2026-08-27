import { ArrowDown } from 'lucide-react'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import type { ReactNode } from 'react'
import styles from './TechHero.module.css'

type TechHeroProps = {
  badgeLabel: string
  headlineLead: string
  headlineReveal: string
  children: ReactNode
}

export function TechHero({
  badgeLabel,
  headlineLead,
  headlineReveal,
  children
}: TechHeroProps) {
  return (
    <header className='relative mb-24 flex min-h-[90vh] flex-col items-center justify-center overflow-hidden border-b border-border bg-background text-center text-foreground'>
      <div className='container mx-auto px-4'>
        <div className='mx-auto flex max-w-4xl flex-col items-center space-y-8'>
          <BrandBadge
            backgroundColor='var(--card)'
            textColor='var(--card-foreground)'
            className={`${styles.badgeEntrance} border-0! px-8! py-3! text-base!`}
          >
            {badgeLabel}
          </BrandBadge>

          <div
            className={`${styles.storyContent} grid justify-items-center gap-8 [&_strong]:text-foreground [&>p]:mx-auto [&>p]:max-w-2xl [&>p]:text-lg [&>p]:leading-relaxed [&>p]:text-foreground/90 md:[&>p]:text-xl`}
          >
            <h1
              aria-label={`${headlineLead} ${headlineReveal}`}
              className='max-w-[12ch] font-google-sans text-5xl leading-[0.94] font-bold text-foreground sm:text-7xl md:text-8xl'
            >
              <span
                className={styles.lineViewport}
                aria-hidden='true'
              >
                <span
                  className={`${styles.storyLine} ${styles.leadLine}`}
                  data-story-beat='lead'
                >
                  {headlineLead}
                </span>
              </span>{' '}
              <span
                className={styles.lineViewport}
                aria-hidden='true'
              >
                <span
                  className={`${styles.storyLine} ${styles.revealLine}`}
                  data-story-beat='reveal'
                >
                  {headlineReveal}
                </span>
              </span>
            </h1>
            {children}
          </div>
        </div>
      </div>
      <div
        className={`${styles.scrollCueEntrance} absolute bottom-12 left-1/2 text-foreground/90`}
      >
        <ArrowDown className='h-6 w-6' aria-hidden />
      </div>
    </header>
  )
}
