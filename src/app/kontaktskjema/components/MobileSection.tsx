// Path: src/app/kontaktskjema/sections/MobileSection.tsx
import { HelpCircle, Leaf, Package } from 'lucide-react'
import { SupportForm } from '@/components/form/components/SupportForm'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'

export function MobileSection() {
  return (
    <div className='lg:hidden'>
      <div className='rounded-lg bg-jungle p-6'>
        <BrandBadge
          label='Kundeservice'
          className='mb-5 border-none bg-primary px-4 py-2 font-utekos-text-medium text-sm leading-4 tracking-normal'
        />
        <h1 className='font-sans text-3xl leading-[0.95] font-extrabold tracking-normal text-foreground'>
          Snakk med Utekos
        </h1>
        <p className='leading-text-paragraph mt-3 text-base tracking-normal text-foreground'>
          Vi er her for å hjelpe deg med alt du måtte lure på.
        </p>

        <ul className='mt-6 space-y-6'>
          <li className='flex items-start gap-3'>
            <HelpCircle className='h-5 w-5 shrink-0 text-ancient-water' />
            <div>
              <h3 className='font-utekos-text-medium text-sm leading-[1.3] tracking-normal text-foreground'>
                Få personlig veiledning
              </h3>
              <p className='leading-text-paragraph mt-1 text-sm tracking-normal text-foreground'>
                Usikker på hvilket produkt som passer ditt bruk?
                Vi hjelper deg å velge riktig.
              </p>
            </div>
          </li>
          <li className='flex items-start gap-3'>
            <Package className='h-5 w-5 shrink-0 text-ancient-water' />
            <div>
              <h3 className='font-utekos-text-medium text-sm leading-[1.3] tracking-normal text-foreground'>
                Hjelp med din bestilling
              </h3>
              <p className='leading-text-paragraph mt-1 text-sm tracking-normal text-foreground'>
                Spørsmål om en ordre, retur eller reklamasjon?
                Oppgi gjerne ordrenummer.
              </p>
            </div>
          </li>
        </ul>
      </div>
      <div className='dark:bg-dark-background/72 border-t border-foreground/12 bg-background/72 p-6'>
        <SupportForm idPrefix='mobile-contact' />
      </div>

      <div className='border-t border-foreground/12'>
        <div className='grid grid-cols-2'>
          <div className='border-r border-foreground/12 bg-jungle p-6'>
            <h4 className='flex items-start gap-1.5 font-utekos-text-medium text-xs leading-[1.3] tracking-normal text-foreground'>
              <span aria-hidden>🇳🇴</span>
              For norske forhold
            </h4>
            <p className='leading-text-paragraph mt-1.5 font-utekos-text text-xs tracking-normal text-foreground'>
              Våre produkter er utviklet for å forlenge de gode
              stundene utendørs, enten det er på en kjølig
              sommerkveld på hytten eller en frisk høstdag i
              båten.
            </p>
          </div>
          <div className='bg-jungle p-6'>
            <h4 className='flex items-start gap-1.5 font-utekos-text-medium text-xs leading-[1.3] tracking-normal text-foreground'>
              <Leaf className='text-soft-warm h-4 w-4' />
              Investering i komfort
            </h4>
            <p className='leading-text-paragraph mt-1.5 font-utekos-text text-xs tracking-normal text-foreground'>
              Mer enn bare et plagg; det er et verktøy designet
              for å gi deg utallige timer med varme og velvære.
            </p>
          </div>
        </div>
      </div>
      <div className='border-t border-foreground/12 bg-jungle p-6'>
        <blockquote className='leading-text-paragraph font-utekos-text text-sm tracking-normal text-foreground italic'>
          &ldquo;Vårt løfte til deg er enkelt: å levere
          komfortplagg av ypperste kvalitet som lar deg forlenge
          de gode stundene utendørs, uansett vær.&rdquo;
        </blockquote>
        <p className='mt-3 font-utekos-text-medium text-sm leading-[1.3] tracking-normal text-foreground'>
          - Utekos Teamet
        </p>
      </div>
    </div>
  )
}
