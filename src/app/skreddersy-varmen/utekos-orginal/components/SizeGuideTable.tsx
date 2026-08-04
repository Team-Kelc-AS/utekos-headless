import { SizeFeature } from './SizeFeature'
import { SizeGuideAccordionTable } from '@/components/size-guide/SizeGuideAccordionTable'

const UTEKOS_SIZE_COLUMNS = ['Medium', 'Large'] as const

const utekosSizeRows = [
  {
    label: 'Total lengde (nakke til bunn)',
    values: ['170 cm', '200 cm']
  },
  {
    label: 'Brystvidde (flatmål)',
    values: ['85 cm', '100 cm']
  },
  {
    label: 'Armlengde (fra senter nakke)',
    values: ['85 cm', '100 cm']
  },
  {
    label: 'Bredde nederst (flatmål)',
    values: ['66 cm', '75 cm']
  },
  {
    label: 'Lengde på glidelås (V-hals)',
    values: ['73 cm', '85.5 cm']
  },
  {
    label: 'Høyde på hette',
    values: ['35 cm', '35 cm']
  },
  {
    label: 'Høyde på baklomme',
    values: ['42 cm', '42 cm']
  }
] as const

export function SizeGuideTable() {
  return (
    <article
      className='w-full border-t border-[#F4F1EA]/5 bg-background py-24'
      id='size-guide'
    >
      <div className='mx-auto max-w-5xl px-6'>
        <div className='mb-12 text-center'>
          <h3 className='mb-4 font-sans text-3xl font-extrabold text-[#F4F1EA]'>
            Skapt for å tilpasses deg
          </h3>
          <p className='mx-auto max-w-2xl font-utekos-text text-[#F4F1EA]/70'>
            Mer enn bare en størrelse – en garanti for komfort.
            Vi har designet spranget mellom Medium og Large
            bevisst stort, slik at du kan velge basert på hvor
            mye kokong-følelse du ønsker.
          </p>
        </div>
        <div className='mb-12 grid grid-cols-1 gap-8 text-center md:grid-cols-3'>
          <SizeFeature
            title='Snorstramming i livet'
            desc='Skap en mer definert silhuett eller steng varmen inne for en lunere følelse.'
          />
          <SizeFeature
            title='Snorstramming nederst'
            desc='Eliminer trekk fra bakken på kalde dager og forsegl komforten fullstendig.'
          />
          <SizeFeature
            title='Toveis YKK®-glidelås'
            desc='Åpne nedenfra for full bevegelsesfrihet, eller ovenfra for å slippe ut overskuddsvarme.'
          />
        </div>
        <SizeGuideAccordionTable
          columns={UTEKOS_SIZE_COLUMNS}
          rows={utekosSizeRows}
        />
      </div>
    </article>
  )
}
