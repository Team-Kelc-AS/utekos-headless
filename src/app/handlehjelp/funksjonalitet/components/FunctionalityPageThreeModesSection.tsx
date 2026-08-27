// Path: src/app/handlehjelp/funksjonalitet/components/FunctionalityPageThreeModesSection.tsx
import { Coffee, Maximize2, Move } from 'lucide-react'

const modeCardClassName =
  'group relative overflow-hidden rounded-2xl border border-foreground/12 bg-jungle text-foreground p-8 ring-1 ring-foreground/12 transition-all hover:shadow-lg'

export function FunctionalityPageThreeModesSection() {
  return (
    <section
      aria-labelledby='functionality-modes-heading'
      className='border-t border-foreground/20 pt-20 bg-jungle'
    >
      <div className='container mx-auto px-4 py-12 sm:py-16'>
        <h2 id='functionality-modes-heading' className='sr-only'>
          Endeløse bruksmuligheter
        </h2>
        <div className='grid gap-8 md:grid-cols-3'>
          <div
            className={`${modeCardClassName} hover:border-muted/40`}
          >
            <div className='mb-6 inline-flex size-12 items-center justify-center rounded-full text-foreground'>
              <Maximize2 className='size-6' aria-hidden />
            </div>
            <h3 className='font-sans mb-3 text-xl font-bold text-foreground'>
              1. Fullengdemodus
            </h3>
            <p className='mb-4 pb-2 text-foreground md:text-2xl'>
              For maksimal varme og ro
            </p>
            <p className='/90 mt-2 font-utekos-text! tracking-wide text-foreground/90 md:text-xl!'>
              Dette er utgangspunktet for selve utekosen. Her
              henger plagget i sin fulle lengde og fungerer som
              en isolerende kokong. Perfekt når du sitter i
              solveggen, ligger i hengekøyen eller nyter lange
              kvelder på terrassen. Her er fokuset total
              avslapning og maksimal varmebevaring.
            </p>
          </div>

          <div
            className={`${modeCardClassName} hover:border-orange-300/40`}
          >
            <div className='mb-6 inline-flex size-12 items-center justify-center rounded-full bg-orange-900/30 text-orange-300'>
              <Coffee className='size-6' aria-hidden />
            </div>
            <h3 className='font-google-sans mb-3 text-xl font-bold text-foreground'>
              2. Oppjustert modus
            </h3>
            <p className='mb-4 text-sm font-medium text-foreground'>
              For raske ærend og innendørs bruk
            </p>
            <p className='/90 text-foreground/90'>
              Skal du en rask tur på kjøkkenet, hente mer kaffe
              eller et ærend på toalettet? Ved å stramme snoren i
              livet kan du raskt heise opp lengden. Dette gir deg
              umiddelbar mobilitet uten at plagget subber i
              bakken. Du beveger deg trygt og snublegirtt, uten å
              måtte ta av deg varmen.
            </p>
          </div>

          <div
            className={`${modeCardClassName} hover:border-light-teal/40`}
          >
            <div className='mb-6 inline-flex size-12 items-center justify-center rounded-full bg-jungle/30 text-light-teal'>
              <Move className='size-6' aria-hidden />
            </div>
            <h3 className='font-google-sans mb-3 text-xl font-bold text-foreground'>
              3. Parkasmodus
            </h3>
            <p className='mb-4 text-sm font-medium text-foreground'>
              For turer og aktiv eleganse
            </p>
            <p className='text-foreground/90'>
              Skal du bevege deg over lengre avstander, gå tur
              med hunden eller slå av en prat med naboen? Ved å
              brette nedre del av plagget innunder deg og stramme
              til i livet, forvandles Utekos til en stilig
              parkas. Dette sikrer full bevegelsesfrihet og et
              elegant utseende, samtidig som du beholder den gode
              varmen.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
