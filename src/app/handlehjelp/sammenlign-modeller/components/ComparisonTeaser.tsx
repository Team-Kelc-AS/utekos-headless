import type { Route } from 'next'
import Link from 'next/link'
import { CompareButton } from './CompareButton'
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
      'bg-muted text-foreground',
    iconShellClass:
      'bg-cloud-dancer text-foreground',
    iconClass: 'text-black',
    textClass: 'text-foreground',
    descriptionClass: 'text-foreground',
    lesmerClass:
      'text-foreground  group-hover:text-foreground'
  },
  {
    title: 'Utekos TechDown™',
    handle: 'utekos-techdown',
    description:
      'Vår nyeste, varmeste og mest allsidige modell.',
    icon: Droplets,
    cardClass:
      'bg-muted text-foreground',
    iconShellClass:
      'bg-cloud-dancer text-black ',
    iconClass: 'text-black ',
    textClass: 'text-foreground ',
    descriptionClass: 'text-foreground ',
    lesmerClass:
      'text-foreground group-hover:text-foreground'
  },
  {
    title: 'Utekos Mikrofiber™',
    handle: 'utekos-mikrofiber',
    description:
      'For for bruk i aktivitet eller varmere temperaturer.',
    icon: Layers,
    cardClass:
      'bg-muted text-foreground',
    iconShellClass:
      'bg-cloud-dancer text-foreground ',
    iconClass: 'text-black',
    textClass: 'text-foreground',
    descriptionClass: 'text-foreground',
    lesmerClass:
      'text-foreground  group-hover:text-foreground'
  }
]

export function ComparisonTeaser() {
  return (
    <article className='mb-24 px-4 py-12 md:py-16'>
      <div className='container mx-auto overflow-hidden rounded-3xl border border-white/5 bg-jungle'>
        <div className='absolute inset-0 -z-10 opacity-20'>
          <div className='absolute inset-0' />
        </div>

        <div className='p-6 text-center max-sm:text-left md:p-16'>
          <h2 className='font-sans text-4xl font-bold text-foreground sm:text-5xl md:text-6xl'>
            Usikker på hvilken Utekos du skal velge?
          </h2>

          <p className='mx-auto mt-6 max-w-4xl text-[1.2rem] leading-relaxed text-foreground'>
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
                  'group relative flex flex-col rounded-2xl p-6 transition-all duration-300',
                  'hover:-translate-y-1',
                  model.cardClass
                )}
              >
                <div className='mb-4 flex items-center gap-4'>
                  <div
                    className={cn(
                      'flex size-12 items-center justify-center rounded-xl',
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
                      'font-sans text-lg font-bold transition-colors',
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
                <CompareButton href='/handlehjelp/sammenlign-modeller' />
        </div>

      </div>
  
    </article>
  )
}
