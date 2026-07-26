// Path: src/app/kontaktskjema/sections/DesktopSection.tsx
import { HelpCircle, Leaf, Package } from 'lucide-react'
import { SupportForm } from '@/components/form/components/SupportForm'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'

export function DesktopSection() {
  return (
    <div className='hidden lg:grid lg:grid-cols-2'>
      <div className='flex flex-col'>
        <div className='grow p-8 lg:p-12'>
          <BrandBadge
            label='Kundeservice'
            backgroundColor='var(--secondary)'
            textColor='var(--secondary-foreground)'
            className='mb-6 border border-current px-4 py-2 font-utekos-text-medium text-sm leading-4 tracking-normal'
          />
          <h1 className='font-google-sans text-4xl leading-[0.95] font-bold tracking-normal text-foreground'>
            Snakk med Utekos
          </h1>
          <p className='leading-text-paragraph /90 mt-4 max-w-xl text-xl tracking-normal text-foreground/90'>
            Vi er her for å hjelpe deg med alt du måtte lure på.
          </p>

          <ul className='mt-8 space-y-8'>
            <li className='flex items-start gap-4'>
              <HelpCircle className='shrink-0-ancient-water h-6 w-6' />
              <div>
                <h3 className='leading-tighttracking-normal font-utekos-text-medium text-foreground'>
                  Få personlig veiledning
                </h3>
                <p className='leading-text-paragraph /90 mt-1 text-base tracking-normal text-foreground/90'>
                  Usikker på hvilket produkt som passer ditt
                  bruk? Vi hjelper deg å velge riktig.
                </p>
              </div>
            </li>
            <li className='flex items-start gap-4'>
              <Package className='shrink-0-ancient-water h-6 w-6' />
              <div>
                <h3 className='font-utekos-text-medium leading-tight tracking-normal text-foreground'>
                  Hjelp med din bestilling
                </h3>
                <p className='leading-text-paragraph /90 mt-1 text-base tracking-normal text-foreground/90'>
                  Spørsmål om en ordre, retur eller reklamasjon?
                  Oppgi gjerne ordrenummer.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className='border-y border-foreground/12'>
          <div className='grid grid-cols-1 sm:grid-cols-2'>
            <div className='border-r border-foreground/12 p-6 sm:p-8 lg:px-8 lg:py-12'>
              <h4 className='flex items-center gap-2 font-utekos-text-medium leading-tight tracking-normal text-foreground'>
                <Leaf className='text-soft-warm h-5 w-5' />
                En investering i komfort
              </h4>
              <p className='leading-text-paragraph /90 mt-2 max-w-prose text-base tracking-normal text-foreground/90'>
                Mer enn bare et plagg; det er et verktøy designet
                for å gi deg utallige timer med varme og velvære.
              </p>
            </div>

            <div className='p-6 sm:p-8 lg:px-8 lg:py-12'>
              <h4 className='leading-tighttracking-normal flex items-center gap-2 font-utekos-text-medium text-foreground'>
                <span aria-hidden>🇳🇴</span>
                <span className='sr-only'>Norsk</span>
                Skapt for norske forhold
              </h4>
              <p className='leading-text-paragraph /90 mt-2 max-w-prose text-base tracking-normal text-foreground/90'>
                Våre produkter er utviklet for å forlenge de gode
                stundene utendørs, enten det er på en kjølig
                sommerkveld på hytten eller en frisk høstdag i
                båten.
              </p>
            </div>
          </div>
        </div>

        <div className='p-8 lg:p-12'>
          <blockquote className='leading-text-paragraph /90 text-lg tracking-normal text-foreground/90 italic'>
            &ldquo;Vårt løfte til deg er enkelt: å levere
            komfortplagg av ypperste kvalitet som lar deg
            forlenge de gode stundene utendørs, uansett
            vær.&rdquo;
          </blockquote>
          <p className='mt-4 font-utekos-text-medium leading-tight tracking-normal text-foreground'>
            - Utekos
          </p>
        </div>
      </div>

      <div className='dark:bg-dark-background/72 border-l border-foreground/12 bg-background/72 p-8 lg:p-12'>
        <SupportForm idPrefix='desktop-contact' />
      </div>
    </div>
  )
}
