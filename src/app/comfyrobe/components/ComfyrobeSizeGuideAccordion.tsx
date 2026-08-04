import { SizeGuideAccordionTable } from '@/components/size-guide/SizeGuideAccordionTable'
import { comfyrobeData } from '@/app/handlehjelp/storrelsesguide/utils/data'

const COMFYROBE_SIZE_COLUMNS = ['XS', 'XL'] as const

/** Key purchase-relevant measurements from the full Comfyrobe size guide. */
const COMFYROBE_ACCORDION_MEASUREMENTS = [
  'Total lengde (fra HSP til front)',
  'Bredde over bryst',
  'Ermelengde',
  'Skulderbredde',
  'Glidelåslengde',
  'Hettehøyde',
  'Hettebredde'
] as const

const comfyrobeAccordionRows = COMFYROBE_ACCORDION_MEASUREMENTS.flatMap(
  measurement => {
    const row = comfyrobeData.find(
      entry => entry.measurement === measurement
    )
    if (!row) return []
    return [
      {
        label: row.measurement,
        values: [row.xs, row.lxl]
      }
    ]
  }
)

export function ComfyrobeSizeGuideAccordion() {
  return (
    <section
      id='comfyrobe-landing-size-guide'
      aria-labelledby='comfyrobe-landing-size-guide-heading'
      className='w-full bg-background px-6 py-16 text-foreground md:py-20'
    >
      <div className='mx-auto max-w-5xl'>
        <div className='mb-10 text-center'>
          <p className='mb-3 font-utekos-text-medium text-sm tracking-wide text-primary uppercase'>
            Passform
          </p>
          <h2
            id='comfyrobe-landing-size-guide-heading'
            className='font-sans text-3xl font-extrabold tracking-tight md:text-4xl'
          >
            Finn riktig Comfyrobe™-størrelse
          </h2>
          <p className='mx-auto mt-4 max-w-2xl font-utekos-text text-base leading-relaxed text-foreground/80 md:text-lg'>
            Comfyrobe™ er bevisst romslig. Bruk målene under for å
            sammenligne XS og XL — eller se den komplette guiden
            for flere detaljer.
          </p>
        </div>

        <SizeGuideAccordionTable
          id='comfyrobe-landing-size-table'
          triggerLabel='Se størrelsestabell'
          columns={COMFYROBE_SIZE_COLUMNS}
          rows={comfyrobeAccordionRows}
        />

        <p className='mt-6 text-center font-utekos-text text-sm text-foreground/70'>
          Trenger du mer detaljer?{' '}
          <a
            href='/handlehjelp/storrelsesguide#comfyrobe-size-guide'
            className='font-utekos-text-medium text-foreground underline underline-offset-4 hover:text-primary'
          >
            Åpne full størrelsesguide for Comfyrobe™
          </a>
        </p>
      </div>
    </section>
  )
}
