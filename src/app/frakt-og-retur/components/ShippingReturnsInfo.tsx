// Path: src/app/frakt-og-retur/components/ShippingReturnsInfo.tsx
import { AnimatedBlock } from '@/components/AnimatedBlock'
import { shippingReturnsFaqItems } from '@/app/frakt-og-retur/data/shippingReturnsContent'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  Clock,
  Mail,
  PackageCheck,
  ShieldCheck,
  Truck,
  Undo2
} from 'lucide-react'

export function ShippingReturnsInfo() {
  return (
    <div className='flex w-full flex-col items-start lg:col-span-8'>
      {/* Informasjonskort med PatternCard-struktur */}
      <div className='grid w-full gap-6 md:grid-cols-2 lg:gap-8'>
        <AnimatedBlock
          className='will-animate-fade-in-up h-full'
          delay='0.2s'
        >
          <article className='bg-night mt-4 flex h-full min-w-0 flex-col rounded-2xl p-2'>
            <div className='dark:ring-dark-border flex h-full flex-col items-start rounded-xl bg-jungle p-6 shadow-sm ring-1 ring-border sm:p-8'>
              <header className='mb-4 flex flex-col items-start gap-4'>
                <div className='dark:ring-dark-border/50 flex size-12 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground ring-1 ring-border/50'>
                  <Truck
                    className='size-6'
                    strokeWidth={1.8}
                    aria-hidden='true'
                  />
                </div>
                <h2 className='text-left font-utekos-text-medium text-xl leading-tight text-foreground'>
                  Frakt og levering
                </h2>
              </header>
              <p className='/80 mb-6 max-w-prose text-left font-utekos-text text-base leading-relaxed text-foreground/80'>
                Tiden avhenger av hvor i landet pakken skal
                sendes, hvor den sendes fra, tid på døgnet og
                ukedag.
              </p>
              <ul className='mt-auto flex w-full flex-col gap-4 text-left'>
                <li className='flex items-start gap-3'>
                  <Clock
                    className='mt-1 size-5 shrink-0 text-foreground'
                    aria-hidden='true'
                  />
                  <span className='/90 text-base leading-relaxed text-foreground/90'>
                    Leveringstid er normalt 2-5 virkedager.
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <Mail
                    className='mt-1 size-5 shrink-0 text-foreground'
                    aria-hidden='true'
                  />
                  <span className='/90 text-base leading-relaxed text-foreground/90'>
                    Sporing sendes på e-post så snart pakken er
                    på vei.
                  </span>
                </li>
              </ul>
            </div>
          </article>
        </AnimatedBlock>

        <AnimatedBlock
          className='will-animate-fade-in-up h-full'
          delay='0.4s'
        >
          <article className='flex h-full min-w-0 mt-4 flex-col rounded-2xl bg-night p-2'>
            <div className='dark:ring-dark-border flex h-full flex-col items-start rounded-xl bg-jungle p-6 shadow-sm ring-1 ring-border sm:p-8'>
              <header className='mb-4 flex flex-col items-start gap-4'>
                <div className='flex size-12 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground ring-1 ring-border/50'>
                  <Undo2
                    className='size-6'
                    strokeWidth={1.8}
                    aria-hidden='true'
                  />
                </div>
                <h2 className='text-left font-utekos-text-medium text-xl leading-tight text-foreground'>
                  Retur og angrerett
                </h2>
              </header>
              <p className='/80 mb-6 max-w-prose text-left font-utekos-text text-base leading-relaxed text-foreground/80'>
                Du har 14 dagers angrerett fra dagen du mottar
                varen.
              </p>
              <ul className='mt-auto flex w-full flex-col gap-4 text-left'>
                <li className='flex items-start gap-3'>
                  <ShieldCheck
                    className='mt-1 size-5 shrink-0 text-foreground'
                    aria-hidden='true'
                  />
                  <span className='/90 text-base leading-relaxed text-foreground/90'>
                    Full trygghet for å kjenne på kvaliteten
                    hjemme.
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <PackageCheck
                    className='mt-1 size-5 shrink-0 text-foreground'
                    aria-hidden='true'
                  />
                  <span className='/90 text-base leading-relaxed text-foreground/90'>
                    Varen må være ubrukt, uten lukt og med
                    merkelapper intakt.
                  </span>
                </li>
              </ul>
            </div>
          </article>
        </AnimatedBlock>
      </div>

      {/* Accordion Seksjon */}
      <AnimatedBlock
        className='will-animate-fade-in-up mt-16 w-full'
        delay='0.6s'
      >
        <div className='mb-6 flex flex-col items-start'>
          <h2 className='font-google-sans text-left font-sans text-2xl leading-tight font-bold text-foreground sm:text-3xl'>
            Slik fungerer returprosessen
          </h2>
        </div>
        <Accordion className='w-full border-t border-border **:data-[slot=accordion-content]:animate-none!'>
          {shippingReturnsFaqItems.map(item => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className='border-border'
            >
              <AccordionTrigger
                data-track={`ShippingReturns-${item.id}-Click`}
                className='dark:hover:text-dark-foreground/80 dark:svg]:text-dark-foreground/90 text-left text-lg leading-relaxed font-medium text-foreground transition-colors hover:text-foreground/80 hover:no-underline [&>svg]:text-foreground/90'
              >
                {item.question}
              </AccordionTrigger>
              <AccordionContent className='/90 max-w-prose text-left text-base leading-relaxed text-foreground/90'>
                {item.id === 'return-process' ?
                  <p>
                    Send en e-post til{' '}
                    <a
                      href='mailto:kundeservice@utekos.no'
                      data-track='ShippingReturnsEmailClick'
                      className='dark:decoration-dark-foreground/30 dark:hover:decoration-dark-foreground font-utekos-text-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground'
                    >
                      kundeservice@utekos.no
                    </a>{' '}
                    med fullt navn, adresse, ordrenummer og
                    hvilke produkter returen gjelder. Pakk varen
                    forsvarlig og bruk en sendingsmetode med
                    sporing.
                  </p>
                : <p>{item.answer}</p>}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </AnimatedBlock>
    </div>
  )
}
