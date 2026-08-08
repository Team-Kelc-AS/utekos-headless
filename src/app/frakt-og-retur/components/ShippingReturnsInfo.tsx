import { AnimatedBlock } from '@/components/AnimatedBlock'
import { shippingReturnsFaqItems } from '@/app/frakt-og-retur/data/shippingReturnsContent'
import {
  returnPolicy,
  returnPolicyCopy
} from '@/lib/policies/returnPolicy'
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
  const address = returnPolicy.returnAddress

  return (
    <div className='flex w-full flex-col items-start lg:col-span-8'>
      <div className='grid w-full gap-6 md:grid-cols-2 lg:gap-8'>
        <AnimatedBlock
          className='will-animate-fade-in-up h-full'
          delay='0.2s'
        >
          <article className='mt-4 flex h-full min-w-0 flex-col rounded-2xl bg-night p-2'>
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
              <p className='mb-6 max-w-prose text-left font-utekos-text text-base leading-relaxed text-foreground/80'>
                Frakt koster 99 kr på bestillinger under 999 kr.
                Bestillinger over 999 kr sendes fraktfritt i
                Norge.
              </p>
              <ul className='mt-auto flex w-full flex-col gap-4 text-left'>
                <li className='flex items-start gap-3'>
                  <Clock
                    className='mt-1 size-5 shrink-0 text-foreground'
                    aria-hidden='true'
                  />
                  <span className='text-base leading-relaxed text-foreground/90'>
                    Leveringstiden er normalt 2–5 virkedager.
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <Mail
                    className='mt-1 size-5 shrink-0 text-foreground'
                    aria-hidden='true'
                  />
                  <span className='text-base leading-relaxed text-foreground/90'>
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
          <article className='mt-4 flex h-full min-w-0 flex-col rounded-2xl bg-night p-2'>
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
              <p className='mb-6 max-w-prose text-left font-utekos-text text-base leading-relaxed text-foreground/80'>
                {returnPolicyCopy.summary}
              </p>
              <ul className='mt-auto flex w-full flex-col gap-4 text-left'>
                <li className='flex items-start gap-3'>
                  <ShieldCheck
                    className='mt-1 size-5 shrink-0 text-foreground'
                    aria-hidden='true'
                  />
                  <span className='text-base leading-relaxed text-foreground/90'>
                    Fristen regnes fra dagen du fysisk mottar
                    varen.
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <PackageCheck
                    className='mt-1 size-5 shrink-0 text-foreground'
                    aria-hidden='true'
                  />
                  <span className='text-base leading-relaxed text-foreground/90'>
                    Refusjon initieres innen{' '}
                    {
                      returnPolicy.processRefundBusinessDays
                        .minimum
                    }
                    –
                    {
                      returnPolicy.processRefundBusinessDays
                        .maximum
                    }{' '}
                    virkedager etter mottak og kontroll.
                  </span>
                </li>
              </ul>
            </div>
          </article>
        </AnimatedBlock>
      </div>

      <AnimatedBlock
        className='will-animate-fade-in-up mt-12 w-full'
        delay='0.5s'
      >
        <section
          aria-labelledby='return-policy-summary-heading'
          className='rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8'
        >
          <h2
            id='return-policy-summary-heading'
            className='font-google-sans text-2xl font-bold sm:text-3xl'
          >
            Returpolicy – kort fortalt
          </h2>
          <dl className='mt-6 grid gap-6 sm:grid-cols-2'>
            <div>
              <dt className='font-utekos-text-medium text-base'>
                Angrefrist
              </dt>
              <dd className='mt-1 font-utekos-text leading-relaxed text-card-foreground/90'>
                {returnPolicy.returnWindowDays} kalenderdager fra
                fysisk mottak
              </dd>
            </div>
            <div>
              <dt className='font-utekos-text-medium text-base'>
                Returfrakt
              </dt>
              <dd className='mt-1 font-utekos-text leading-relaxed text-card-foreground/90'>
                Kunden oppretter og betaler returfrakten
              </dd>
            </div>
            <div>
              <dt className='font-utekos-text-medium text-base'>
                Behandlingstid
              </dt>
              <dd className='mt-1 font-utekos-text leading-relaxed text-card-foreground/90'>
                {returnPolicy.processRefundBusinessDays.minimum}–
                {returnPolicy.processRefundBusinessDays.maximum}{' '}
                virkedager etter mottak og kontroll
              </dd>
            </div>
            <div>
              <dt className='font-utekos-text-medium text-base'>
                Returmetode
              </dt>
              <dd className='mt-1 font-utekos-text leading-relaxed text-card-foreground/90'>
                Retur med post til den publiserte returadressen
              </dd>
            </div>
          </dl>
        </section>
      </AnimatedBlock>

      <AnimatedBlock
        className='will-animate-fade-in-up mt-12 w-full'
        delay='0.6s'
      >
        <section
          id='slik-returnerer-du'
          aria-labelledby='return-steps-heading'
          className='scroll-mt-28'
        >
          <h2
            id='return-steps-heading'
            className='font-google-sans text-2xl font-bold sm:text-3xl'
          >
            Slik returnerer du
          </h2>
          <ol className='mt-6 flex max-w-prose list-decimal flex-col gap-6 pl-6 font-utekos-text text-base leading-relaxed text-foreground/90 marker:font-bold marker:text-foreground'>
            <li>
              {returnPolicyCopy.notice}{' '}
              <a
                href={`mailto:${returnPolicy.contactEmail}`}
                data-track='ShippingReturnsEmailClick'
                className='font-utekos-text-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground'
              >
                {returnPolicy.contactEmail}
              </a>
              .
            </li>
            <li>{returnPolicyCopy.returnDeadline}</li>
            <li>{returnPolicyCopy.returnShipping}</li>
          </ol>

          <div className='mt-8 max-w-prose rounded-2xl border border-border bg-muted/40 p-6'>
            <h3 className='font-utekos-text-medium text-lg'>
              Returadresse
            </h3>
            <address className='mt-3 leading-relaxed text-foreground/90 not-italic'>
              {address.recipient}
              <br />
              {address.streetAddress}
              <br />
              {address.postalCode} {address.addressLocality}
              <br />
              Norge
            </address>
          </div>
        </section>

        <section
          id='refusjon'
          aria-labelledby='refund-heading'
          className='mt-12 scroll-mt-28'
        >
          <h2
            id='refund-heading'
            className='font-google-sans text-2xl font-bold sm:text-3xl'
          >
            Refusjon og behandlingstid
          </h2>
          <div className='mt-5 flex max-w-prose flex-col gap-4 font-utekos-text text-base leading-relaxed text-foreground/90'>
            <p>{returnPolicyCopy.refund}</p>
            <p>{returnPolicyCopy.refundTiming}</p>
          </div>
        </section>

        <section
          id='varens-tilstand'
          aria-labelledby='condition-heading'
          className='mt-12 scroll-mt-28'
        >
          <h2
            id='condition-heading'
            className='font-google-sans text-2xl font-bold sm:text-3xl'
          >
            Varens tilstand og verdireduksjon
          </h2>
          <p className='mt-5 max-w-prose font-utekos-text text-base leading-relaxed text-foreground/90'>
            {returnPolicyCopy.condition}
          </p>
        </section>

        <section
          id='unntak'
          aria-labelledby='exceptions-heading'
          className='mt-12 scroll-mt-28'
        >
          <h2
            id='exceptions-heading'
            className='font-google-sans text-2xl font-bold sm:text-3xl'
          >
            Unntak fra angreretten
          </h2>
          <p className='mt-5 max-w-prose font-utekos-text text-base leading-relaxed text-foreground/90'>
            {returnPolicyCopy.exceptions}
          </p>
        </section>

        <section
          id='reklamasjon'
          aria-labelledby='complaint-heading'
          className='mt-12 scroll-mt-28'
        >
          <h2
            id='complaint-heading'
            className='font-google-sans text-2xl font-bold sm:text-3xl'
          >
            Reklamasjon, skade eller feilsendt vare
          </h2>
          <p className='mt-5 max-w-prose font-utekos-text text-base leading-relaxed text-foreground/90'>
            {returnPolicyCopy.complaint}
          </p>
        </section>

        <p className='mt-12 text-sm text-foreground/70'>
          Sist oppdatert:{' '}
          <time dateTime={returnPolicy.lastUpdated}>
            {returnPolicy.lastUpdatedLabel}
          </time>
        </p>
      </AnimatedBlock>

      <AnimatedBlock
        className='will-animate-fade-in-up mt-16 w-full'
        delay='0.7s'
      >
        <section aria-labelledby='shipping-returns-faq-heading'>
          <h2
            id='shipping-returns-faq-heading'
            className='font-google-sans text-left text-2xl leading-tight font-bold text-foreground sm:text-3xl'
          >
            Ofte stilte spørsmål
          </h2>
          <Accordion className='mt-6 w-full border-t border-border **:data-[slot=accordion-content]:animate-none!'>
            {shippingReturnsFaqItems.map(item => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className='border-border'
              >
                <AccordionTrigger
                  data-track={`ShippingReturns-${item.id}-Click`}
                  className='text-left text-lg leading-relaxed font-medium text-foreground transition-colors hover:text-foreground/80 hover:no-underline [&>svg]:text-foreground/90'
                >
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className='max-w-prose text-left text-base leading-relaxed text-foreground/90'>
                  <p>{item.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </AnimatedBlock>
    </div>
  )
}
