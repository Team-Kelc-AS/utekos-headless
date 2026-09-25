import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { CompassIcon } from '@/components/animate-icons/icons/compass'
import { nbccUseCases } from '../utils/nbccLandingPageContent'
import { useCaseIcons } from '../utils/useCaseIcons'
import { NbccReveal, NbccRevealGroup } from './NbccReveal'

export function NbccUseCasesSection() {
  return (
    <article className='relative overflow-hidden bg-night px-4 py-20 text-foreground sm:px-6 lg:px-8'>
      <div className='absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-foreground/20 to-transparent' />
      <div className='mx-auto max-w-7xl'>
        <NbccReveal className='grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end'>
          <div>
            <p className='font-sans font-semibold text-sm text-foreground'>
              Campinglivet har mange former
            </p>
            <h2 className='mt-4 max-w-xl font-sans font-semibold text-3xl tracking-normal text-balance text-foreground sm:text-4xl'>
              Fra morgenkaffe til den siste praten i forteltet.
            </h2>
          </div>
          <p className='max-w-2xl text-base text-foreground lg:justify-self-end'>
            For noen ligger den største gleden i friheten til å
            våkne til ny utsikt, for andre er det det trygge
            fellesskapet på fastplassen eller latteren rundt
            bordet på et regionstreff. Uansett hvor du slår leir,
            eller om du nyter roen på terrassen hjemme, er
            fellesnevneren den samme: De aller beste stundene
            skapes utendørs.
          </p>
        </NbccReveal>

        <NbccRevealGroup className='mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {nbccUseCases.map((useCase, index) => {
            const Icon = useCaseIcons[index] ?? CompassIcon
            return (
              <NbccReveal item key={useCase.title}>
                <Accordion
                  data-nbcc-usecase-card
                  className='rounded-lg border border-foreground/15 bg-jungle text-foreground'
                >
                  <AccordionItem
                    value={useCase.title}
                    className='border-none'
                  >
                    <AccordionTrigger className='items-center gap-3 px-6 py-5 text-left hover:no-underline hover:text-primary focus-visible:ring-foreground/30'>
                      <span className='flex min-w-0 flex-1 items-center gap-3'>
                        <Icon
                          size={28}
                          animateOnHover='default'
                          className='shrink-0 text-primary'
                          aria-hidden
                        />
                        <span className='font-sans font-semibold text-lg text-foreground'>
                          {useCase.title}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className='px-6 pb-6 text-sm leading-7 text-foreground'>
                      {useCase.description}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </NbccReveal>
            )
          })}
        </NbccRevealGroup>
      </div>
    </article>
  )
}
