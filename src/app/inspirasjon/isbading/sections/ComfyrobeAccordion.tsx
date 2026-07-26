'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils/className'

type ComfyrobeAccordionItem = {
  value: string
  trigger: string
  content: React.ReactNode
  contentClassName?: string
}

const items: ComfyrobeAccordionItem[] = [
  {
    value: 'about',
    trigger: 'Om Comfyrobe™',
    contentClassName:
      'space-y-3 text-sm leading-text-paragraph tracking-normal text-foreground ',
    content: (
      <>
        <p>
          Tøff mot været, komfortabel for deg – Comfyrobe™
          forener teknisk funksjon med tidløst design.
          HydroGuard™-ytterstoffet er vanntett og vindtett, mens pustende egenskaper slipper fukt ut
          og forhindrer klamhet. Skapt for å holde deg varm, tørr
          og beskyttet – enten på hytteterrassen, ved bobilen,
          etter isbading eller til hverdagslige ærend.
        </p>
        <p>
          Innsiden er fôret med SherpaCore™ – et tykt lag
          syntetisk lammeull som umiddelbart omslutter deg med
          varme og absorberer fukt fra kroppen. Det rene designet
          med diskré farger passer like godt på fjellet som i
          byen.
        </p>
      </>
    )
  },
  {
    value: 'materials',
    trigger: 'Materialer og kvalitet',
    contentClassName: 'space-y-4 text-foreground ',
    content: (
      <>
        <div>
          <strong className='mb-1 block text-sm text-foreground'>
            Fôrstoff: SherpaCore™ Thermal Lining
          </strong>
          <ul className='leading-text-paragraph list-inside list-disc pl-1 text-sm tracking-normal'>
            <li>Mykt og luftig 100% polyester (250 GSM)</li>
            <li>Antipeeling behandlet</li>
            <li>Slitesterk og rivebestandig hamp i kragen</li>
          </ul>
        </div>
        <div>
          <strong className='mb-1 block text-sm text-foreground'>
            Ytterstoff: HydroGuard™ Shell
          </strong>
          <ul className='leading-text-paragraph list-inside list-disc pl-1 text-sm tracking-normal'>
            <li>100% polyester med pustende PU-belegg</li>
            <li>8000 mm vannsøyle (vanntett)</li>
            <li>Vindtett og robust (130 GSM)</li>
          </ul>
        </div>
        <div>
          <strong className='mb-1 block text-sm text-foreground'>
            Glidelåser: YKK®
          </strong>
          <p className='leading-text-paragraph text-sm tracking-normal'>
            Solid toveis glidelås for enkel av- og påkledning –
            både innenfra og utenfra.
          </p>
        </div>
      </>
    )
  },
  {
    value: 'features',
    trigger: 'Funksjoner',
    contentClassName: 'space-y-3 text-foreground ',
    content: (
      <>
        <div>
          <strong className='mb-1 block text-sm'>
            Vanntett og vindtett
          </strong>
          <p className='leading-text-paragraph text-sm tracking-normal'>
            Med minimum 8000 mm vannsøyle og pustende membran
            (~3000 g/m²/24 t) holder Comfyrobe™
            deg tørr i regn og skjermer effektivt mot vind – uten
            klamhet.
          </p>
        </div>
        <div>
          <strong className='mb-1 block text-sm'>
            Varm og hurtigtørkende
          </strong>
          <p className='leading-text-paragraph text-sm tracking-normal'>
            SherpaCore™ plysj gir umiddelbar varmeisolering og
            absorberer restfuktighet – ideelt rett etter isbad
            eller vannsport.
          </p>
        </div>
        <div>
          <strong className='mb-1 block text-sm'>
            Justerbar ermekant
          </strong>
          <p className='leading-text-paragraph text-sm tracking-normal'>
            Forhøyet stropp med borrelås ved ermekanten gjør det
            enkelt å stramme eller løsne ermet – perfekt for å
            holde vind ute eller tilpasse passformen over
            hansker.
          </p>
        </div>
      </>
    )
  },
  {
    value: 'design',
    trigger: 'Design og detaljer',
    contentClassName: 'text-foreground ',
    content: (
      <ul className='leading-text-paragraph space-y-2 text-sm tracking-normal'>
        <li>
          Stor, romslig og justerbar hette for ekstra beskyttelse
        </li>
        <li>Toveis YKK®-glidelås for enkel av- og påkledning</li>
        <li>
          Splitt bak og i sidene gir økt bevegelighet og komfort
        </li>
        <li>
          Unisex-snitt med diskré refleksdetaljer for synlighet i
          mørket
        </li>
        <li>
          To varme, fôrede sidelommer og innerlomme for
          personlige eiendeler
        </li>
      </ul>
    )
  },
  {
    value: 'usage',
    trigger: 'Bruk og egenskaper',
    contentClassName:
      'space-y-3 text-sm leading-text-paragraph tracking-normal text-foreground ',
    content: (
      <>
        <p>
          Comfyrobe™ er et varmende og beskyttende lag rett etter
          isbad, på kalde tribuner, under campingturer og
          bobilferier – eller som skalljakke i hverdagen. Fra
          sjøen til fjellet, via bobilen og helt hjem til
          terrassen.
        </p>
        <p>
          Enten du sitter i båten en kjølig kveld, slapper av på
          campingen eller nyter morgenkaffen utendørs –
          Comfyrobe™ forbedrer opplevelsen og gjør at den kan
          vare lenger.
        </p>
      </>
    )
  },
  {
    value: 'fit',
    trigger: 'Passform',
    contentClassName:
      'text-sm leading-text-paragraph tracking-normal text-foreground ',
    content: (
      <>
        <p className='mb-2'>
          Comfyrobe™ har en{' '}
          <strong>romslig, unisex og avslappet passform</strong>.
          Den er bevisst designet slik at du enkelt kan trekke
          den over våte klær og tykke gensere.
        </p>
        <p>
          Splittene i sidene og bak sikrer god bevegelsesfrihet,
          selv med den store størrelsen. Oppleves komfortabel,
          omsluttende og robust – helgradert både komfort- og
          motemessig.
        </p>
      </>
    )
  },
  {
    value: 'care',
    trigger: 'Vask og vedlikehold',
    contentClassName:
      'space-y-3 text-sm leading-text-paragraph tracking-normal text-overcast',
    content: (
      <>
        <div>
          <strong className='mb-1 block text-sm text-foreground'>
            Maskinvask
          </strong>
          <ul className='list-inside list-disc space-y-1'>
            <li>Maks 40°C, skånsomt program</li>
            <li>Bruk mildt vaskemiddel</li>
            <li>Ikke benytt blekemiddel</li>
          </ul>
        </div>
        <div>
          <strong className='mb-1 block text-sm text-foreground'>
            Tørking
          </strong>
          <ul className='list-inside list-disc space-y-1'>
            <li>
              Unngå tørketrommel for å bevare vanntettheten
              lengst mulig
            </li>
            <li>
              Om nødvendig: lav temperatur i kort periode for å
              «fluffe» opp fôret
            </li>
            <li>
              Ideelt tørkes plagget hengende – fôret slipper det
              meste av vannet raskt
            </li>
          </ul>
        </div>
        <p>
          Etter vask kan det være lurt å etterbehandle det
          vannavvisende laget med egnet spray eller impregnering,
          spesielt om vann ikke lenger perler seg på overflaten.
        </p>
      </>
    )
  }
]

type ComfyrobeAccordionProps = { className?: string }

export function ComfyrobeAccordion({
  className
}: ComfyrobeAccordionProps) {
  return (
    <Accordion
      className={cn(
        'mt-4 w-full border-t border-foreground/12',
        className
      )}
      defaultValue={['about']}
    >
      {items.map(item => (
        <AccordionItem
          key={item.value}
          value={item.value}
          className='border-foreground/12'
        >
          <AccordionTrigger>{item.trigger}</AccordionTrigger>
          <AccordionContent className={item.contentClassName}>
            {item.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
