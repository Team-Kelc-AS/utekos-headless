import { Coffee, Maximize2, Move } from 'lucide-react'
import { TECH_MODES_SECTION_ID } from '@/app/handlehjelp/teknologi-materialer/constants'

const modeCardClassName =
  'group relative overflow-hidden rounded-3xl border border-card-foreground/10 bg-jungle p-8 text-card-foreground ring-1 ring-card-foreground/12 backdrop-blur-xl transition-all duration-500 hover:border-foreground/20 hover:shadow-2xl'

const modeCardHeadingClassName = 'mb-4 flex items-center gap-4'

const modeClaimClassName =
  'font-google-sans mb-2 text-xl font-bold text-card-foreground'

const modeIconClassName =
  'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card-foreground/10 text-card-foreground ring-1 ring-card-foreground/10'

const modeHoverGlowClassName =
  'pointer-events-none absolute inset-0 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100'

export function TechMaterialsModeCards() {
  return (
    <section
      id={TECH_MODES_SECTION_ID}
      className='relative z-20 container mx-auto -mt-20 scroll-mt-24 px-4 pb-24'
    >
      <div className='grid gap-6 md:grid-cols-3'>
        <div className={modeCardClassName}>
          <div
            className={`${modeHoverGlowClassName} from-secondary/10`}
          />

          <div className='relative z-10'>
            <div className={modeCardHeadingClassName}>
              <div className={modeIconClassName}>
                <Maximize2 className='h-6 w-6' aria-hidden />
              </div>
              <h3 className='font-google-sans text-xl font-bold text-card-foreground'>
                1. Fullengdemodus
              </h3>
            </div>
            <p className={modeClaimClassName}>Maksimal isolasjon</p>
            <p className='leading-text-paragraph font-utekos-text! tracking-wide text-card-foreground/90 md:text-xl!'>
              Utgangspunktet for selve utekosen. Plagget henger i
              full lengde som en isolerende kokong. Perfekt for
              solveggen, hengekøyen eller lange kvelder på
              terrassen.
            </p>
          </div>
        </div>

        <div className={modeCardClassName}>
          <div
            className={`${modeHoverGlowClassName} from-primary/10`}
          />

          <div className='relative z-10'>
            <div className={modeCardHeadingClassName}>
              <div className={modeIconClassName}>
                <Coffee className='h-6 w-6' aria-hidden />
              </div>
              <h3 className='font-google-sans text-xl font-bold text-card-foreground'>
                2. Oppjustert modus
              </h3>
            </div>
            <p className={modeClaimClassName}>
              Umiddelbar mobilitet
            </p>
            <p className='text-card-foreground/90'>
              Nyter du total omfavnelse av Utekos, men må
              plutselig på kjøkkenet eller svare telefonen? Heis
              opp plagget til ønsket lengde, stram snoren i livet
              og bli mobil på sekunder. Beveg deg trygt og
              subbefritt – uten å miste varmen.
            </p>
          </div>
        </div>

        <div className={modeCardClassName}>
          <div
            className={`${modeHoverGlowClassName} from-accent/10`}
          />

          <div className='relative z-10'>
            <div className={modeCardHeadingClassName}>
              <div className={modeIconClassName}>
                <Move className='h-6 w-6' aria-hidden />
              </div>
              <h3 className='font-google-sans text-xl font-bold text-card-foreground'>
                3. Parkasmodus
              </h3>
            </div>
            <p className={modeClaimClassName}>Aktiv utendørs</p>
            <p className='text-card-foreground/90'>
              For turer og lengre avstander. Brett nedre del
              innunder seg og stram til for å forvandle Utekos
              til en stilig parkas. Full bevegelsesfrihet med et
              elegant snitt.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
