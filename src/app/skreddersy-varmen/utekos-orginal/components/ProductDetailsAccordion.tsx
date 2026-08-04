import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { cacheLife, cacheTag } from 'next/cache'
import { SpecRow } from './SpecRow'
import { DetailBlock } from './DetailBlock'
import { UsageGroup } from './UsageGroup'
import { Leaf, ShieldCheck, Waves, Info } from 'lucide-react'

const triggerClassName =
  'font-sans text-left text-lg font-utekos-text-medium text-foreground [&>svg]:text-foreground hover:text-foreground dark:hover:text-foreground hover:no-underline md:text-xl'

const itemClassName = 'border-foreground/20'

export async function ProductDetailsAccordion() {
  'use cache'
  cacheLife('weeks')
  cacheTag(
    'skreddersy-varmen',
    'skreddersy-varmen-product-details'
  )

  return (
    <article className='w-full bg-background px-6 pt-6 pb-24 text-foreground'>
      <div className='mx-auto max-w-3xl'>
        <h2 className='my-8 text-center font-sans text-4xl leading-[0.95] font-extrabold tracking-normal text-foreground md:text-5xl'>
          Alt du trenger å vite
        </h2>

        <Accordion className='w-full'>
          <AccordionItem
            value='materials'
            className={itemClassName}
          >
            <AccordionTrigger className={triggerClassName}>
              Materialer
            </AccordionTrigger>
            <AccordionContent>
              <div className='leading-text-paragraph grid grid-cols-1 gap-x-8 gap-y-4 p-2 text-base md:grid-cols-2'>
                <SpecRow label='Fôrstoff' value='Taffeta' />
                <SpecRow
                  label='Skallstoff'
                  value='DuraLite™ Nylon'
                />
                <SpecRow
                  label='Belegg'
                  value='DWR (inkl. flammehemming)'
                />
                <SpecRow label='Trådtetthet' value='380T' />
                <SpecRow label='Trådtykkelse' value='20D' />
                <SpecRow label='Vekt' value='ca. 800g' />
                <SpecRow label='Glidelåser' value='YKK®' />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value='functions'
            className={itemClassName}
          >
            <AccordionTrigger className={triggerClassName}>
              Nøkkelfunksjoner
            </AccordionTrigger>
            <AccordionContent>
              <ul className='space-y-6 p-2'>
                <DetailBlock
                  title='3-i-1 funksjonalitet'
                  text='Modulært system for sømløs tilpasning. Veksle mellom parkas, oppfestet modus for mobilitet, eller fulldekket modus for maksimal isolasjon og "kokong-følelse".'
                />
                <DetailBlock
                  title='DuraLite™ Nylon (DWR)'
                  text='Vårt robuste lettvekts-materiale (20D/380T). Utviklet for å tåle røff bruk i nordisk natur, enten det er slitasje fra terrenget eller bruk rundt leirplassen. Materialet er vindtett, sterkt vannavvisende og har utmerkede pusteegenskaper.'
                />
                <DetailBlock
                  title='YKK® Dual V-Zip™'
                  text='To-spors glidelåssystem med omvendt V-profil. Gir direkte tilgang til innvendig justering og effektiv ventilasjon uten at frontpartiet må åpnes helt opp.'
                />
                <DetailBlock
                  title='Isolert og justerbar hette'
                  text='Romslig konstruksjon med god isolasjon. Utformet for å gi optimal beskyttelse mot vær og vind, med god plass til lue eller ekstra bekledning under.'
                />
                <DetailBlock
                  title='Lommer og varmemuffe'
                  text='Utstyrt med dype sidelommer for trygg oppbevaring, samt en sentrert, fôret muffe på magen som fungerer som en effektiv håndvarmer.'
                />
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value='features'
            className={itemClassName}
          >
            <AccordionTrigger className={triggerClassName}>
              Egenskaper
            </AccordionTrigger>
            <AccordionContent>
              <ul className='space-y-6 p-2'>
                <li className='flex gap-4'>
                  <Waves
                    className='mt-1 shrink-0 text-foreground'
                    size={20}
                  />
                  <div>
                    <h4 className='mb-1 font-sans text-base font-bold text-foreground'>
                      Håndterer fuktige forhold
                    </h4>
                    <p className='text-foreground'>
                      Den avanserte, syntetiske isolasjonen er
                      konstruert for å prestere optimalt i
                      fuktige forhold. Den beholder isolerende
                      evne når den blir våt og tørker svært
                      raskt.
                    </p>
                  </div>
                </li>
                <li className='flex gap-4'>
                  <Leaf
                    className='mt-1 shrink-0 text-foreground'
                    size={20}
                  />
                  <div>
                    <h4 className='mb-1 font-sans text-base font-bold text-foreground'>
                      Allergivennlig
                    </h4>
                    <p className='text-foreground'>
                      Et gjennomtenkt vegansk valg som gir full
                      trygghet og komfort for deg med dunallergi
                      eller for deg som foretrekker produkter
                      uten animalske materialer.
                    </p>
                  </div>
                </li>
                <li className='flex gap-4'>
                  <ShieldCheck
                    className='mt-1 shrink-0 text-foreground'
                    size={20}
                  />
                  <div>
                    <h4 className='mb-1 font-sans text-base font-bold text-foreground'>
                      Robust og allsidig
                    </h4>
                    <p className='text-foreground'>
                      Utekos™-modellen med lavest vekt, best
                      egnet for både rolig hygge og aktivitet.
                    </p>
                  </div>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='usage' className={itemClassName}>
            <AccordionTrigger className={triggerClassName}>
              Bruksområder
            </AccordionTrigger>
            <AccordionContent>
              <div className='grid grid-cols-1 gap-8 p-2 md:grid-cols-2'>
                <UsageGroup
                  title='Båt- og hytteliv'
                  items={[
                    'Camping, båt og bobillivet',
                    'Perfekt på hytten eller terrassen hjemme'
                  ]}
                />

                <UsageGroup
                  title='Fjellsport og turer'
                  items={[
                    'Pause og bålkos',
                    'Aktiv vandring, toppturer og skiturer',
                    'Isklatring og krevende fjellsport'
                  ]}
                />

                <UsageGroup
                  title='Jakt og fiske'
                  items={[
                    'Smygjakt og posteringsjakt',
                    'Fiske (inkludert isfiske)'
                  ]}
                />

                <UsageGroup
                  title='Til vanns & Annet'
                  items={[
                    'Båt- og seiltur',
                    'Isbading (før og etter)',
                    'På kalde tribuner',
                    'Fotooppdrag i kulden'
                  ]}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='fit' className={itemClassName}>
            <AccordionTrigger className={triggerClassName}>
              Passform
            </AccordionTrigger>
            <AccordionContent>
              <div className='leading-text-paragraph space-y-4 p-2 text-base text-foreground'>
                <p>
                  <strong className='mb-1 block text-foreground'>
                    Rom for bevegelse og ekstra lag
                  </strong>
                  Utekos Mikrofiber™ er designet med sjenerøs
                  passform som gir deg full bevegelsesfrihet og
                  gjør det enkelt å ha flere lag under uten at
                  det føles trangt.
                </p>
                <p>
                  <strong className='mb-1 block text-foreground'>
                    Fra parkas til fullstendig tildekket på
                    sekunder
                  </strong>
                  Med smarte snorstramminger justerer du enkelt
                  passformen for optimal varme og komfort. Gå fra
                  en luftig, beskyttende parkas til en tett og
                  varmende kokong.
                </p>
                <p className='leading-text-paragraph rounded-2xl border border-foreground/15 bg-card p-4 text-sm text-foreground'>
                  <strong>Tips:</strong> Bruk linken ved
                  størrelsevelgeren og i menyen over for å se de
                  nøyaktige målene i tabellen.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='care' className={itemClassName}>
            <AccordionTrigger className={triggerClassName}>
              Vedlikehold
            </AccordionTrigger>
            <AccordionContent>
              <div className='space-y-4 p-2'>
                <ul className='list-inside list-disc space-y-1 text-foreground'>
                  <li>Maskinvask på maks 30°C</li>
                  <li>Bruk mild såpe</li>
                  <li>
                    <span className='font-sans font-bold text-foreground'>
                      Unngå tørketrommelen
                    </span>
                  </li>
                  <li>La den lufttørke (tørker raskt)</li>
                  <li>Unngå stryking og bleking</li>
                </ul>

                <div className='dark:border-dark-primary mt-4 flex gap-3 rounded-2xl border-l-4 border-primary bg-card p-4 text-foreground'>
                  <Info className='dark:text-dark-primary shrink-0 text-primary' />
                  <div className='leading-text-paragraph text-sm'>
                    <span className='font-google-sans mb-1 block font-bold'>
                      Viktig om oppbevaring
                    </span>
                    Oppbevares tørt. Materialet vil absorbere
                    fuktighet under normal bruk, så sørg for at
                    den tørkes godt etter bruk i fuktige
                    omgivelser. For lengre lagring anbefales det
                    å oppbevare plagget ukomprimert (hengende
                    eller løst foldet) for å bevare loft og form.
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </article>
  )
}
