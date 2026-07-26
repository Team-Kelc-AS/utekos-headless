import type { Route } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRightIcon,
  Droplets,
  Feather,
  Layers
} from 'lucide-react'
import { cn } from '@/lib/utils/className'

const models = [
  {
    title: 'Utekos Dun™',
    handle: 'utekos-dun',
    description:
      '(UTSOLGT) - Alternativet for deg som ønsker dun.',
    icon: Feather,
    cardClass:
      'border-border  bg-card  text-card-foreground  hover:bg-card-hover -hover',
    iconShellClass:
      'border-border  bg-primary dark:bg-dark-primary text-primary-foreground ',
    iconClass: 'text-primary-foreground ',
    textClass: 'text-card-foreground ',
    descriptionClass: 'text-card-foreground ',
    lesmerClass:
      'text-card-foreground  group-hover:text-card-foreground dark:group-hover:text-foreground/90-foreground'
  },
  {
    title: 'Utekos TechDown™',
    handle: 'utekos-techdown',
    description:
      'Vår nyeste, varmeste og mest allsidige modell.',
    icon: Droplets,
    cardClass:
      'border-border  bg-card  text-card-foreground  hover:bg-card-hover -hover',
    iconShellClass:
      'border-border  bg-primary dark:bg-dark-primary text-primary-foreground ',
    iconClass: 'text-primary-foreground ',
    textClass: 'text-card-foreground ',
    descriptionClass: 'text-card-foreground ',
    lesmerClass:
      'text-card-foreground  group-hover:text-card-foreground dark:group-hover:text-foreground/90-foreground'
  },
  {
    title: 'Utekos Mikrofiber™',
    handle: 'utekos-mikrofiber',
    description:
      'For for bruk i aktivitet eller varmere temperaturer.',
    icon: Layers,
    cardClass:
      'border-border  bg-card  text-card-foreground  hover:bg-card-hover -hover',
    iconShellClass:
      'border-border  bg-primary dark:bg-dark-primary text-primary-foreground ',
    iconClass: 'text-primary-foreground ',
    textClass: 'text-card-foreground ',
    descriptionClass: 'text-card-foreground ',
    lesmerClass:
      'text-card-foreground  group-hover:text-card-foreground dark:group-hover:text-foreground/90-foreground'
  }
]

export function ComparisonTeaser() {
  return (
    <article className='mb-24 px-4 py-12 md:py-16'>
      <div className='container mx-auto overflow-hidden rounded-3xl border border-white/5 bg-muted shadow-2xl'>
        <div className='absolute inset-0 -z-10 opacity-20'>
          <div className='absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[24px_24px]' />
        </div>

        <div className='p-6 text-center max-sm:text-left md:p-16'>
          <h2 className='font-google-sans font-sans text-4xl font-bold text-foreground sm:text-5xl md:text-6xl'>
            Usikker på hvilken Utekos du skal velge?
          </h2>

          <p className='utekos-section-lead mx-auto mt-6 max-w-4xl text-[1.2rem] leading-relaxed text-foreground'>
            Alle Utekos-modellene har justerbar passform og
            ventilasjon, men har ellers ulike egenskaper og
            styrker. Se vår sammenligningsguide for å finne
            modellen som passer best til dine behov.
          </p>

          <div className='mt-12 grid grid-cols-1 gap-6 text-left md:grid-cols-3'>
            {models.map(model => (
              <Link
                key={model.handle}
                href={`/produkter/${model.handle}` as Route}
                data-track='ComparisonTeaserModelClick'
                className={cn(
                  'group relative flex flex-col rounded-2xl border p-6 transition-all duration-300',
                  'hover:-translate-y-1',
                  model.cardClass
                )}
              >
                <div className='mb-4 flex items-center gap-4'>
                  <div
                    className={cn(
                      'flex size-12 items-center justify-center rounded-xl border transition-colors duration-300',
                      model.iconShellClass
                    )}
                  >
                    <model.icon
                      className={cn(
                        'size-6 transition-transform duration-300 group-hover:scale-110',
                        model.iconClass
                      )}
                    />
                  </div>
                  <h3
                    className={cn(
                      'font-google-sans font-sans text-lg font-bold transition-colors',
                      model.textClass
                    )}
                  >
                    {model.title}
                  </h3>
                </div>

                <p
                  className={cn(
                    '! mb-6 text-[1rem]!',
                    model.descriptionClass
                  )}
                >
                  {model.description}
                </p>

                <div
                  className={cn(
                    'mt-auto flex items-center text-sm font-medium transition-colors',
                    model.lesmerClass
                  )}
                >
                  <span>Les mer</span>
                  <ArrowRightIcon className='ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1' />
                </div>
              </Link>
            ))}
          </div>

          <div className='mt-12'>
            <Button
              asChild
              variant='seeProduct'
              size='lg'
              className='h-12 rounded-full px-8 transition-all'
            >
              <Link
                href={
                  '/handlehjelp/sammenlign-modeller' as Route
                }
                data-track='ComparisonTeaserSeeFullComparisonClick'
              >
                Se full sammenligning
                <ArrowRightIcon className='ml-2 size-4' />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
