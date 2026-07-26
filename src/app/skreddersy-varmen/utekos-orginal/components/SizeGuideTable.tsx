import { Ruler } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { SizeFeature } from './SizeFeature'
import { TableRow } from './TableRow'

export function SizeGuideTable() {
  return (
    <article
      className='w-full border-t border-[#F4F1EA]/5 bg-background py-24'
      id='size-guide'
    >
      <div className='mx-auto max-w-5xl px-6'>
        <div className='mb-12 text-center'>
          <h3 className='mb-4 font-sans text-3xl text-[#F4F1EA]'>
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
        <div className='mx-auto max-w-3xl'>
          <Accordion className='w-full rounded-xl border border-[#F4F1EA]/10 bg-[#2C2420]/30 px-2 md:px-6'>
            <AccordionItem
              value='size-table'
              className='border-none'
            >
              <AccordionTrigger className='justify-center py-6 text-lg font-medium text-[#F4F1EA] transition-colors hover:text-[#E07A5F] hover:no-underline'>
                <span className='flex items-center gap-3'>
                  <Ruler size={20} className='text-[#E07A5F]' />
                  Se størrelsestabell
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className='relative mt-2 mb-6 w-full overflow-hidden rounded-lg border border-[#F4F1EA]/5 bg-[#2C2420]/40'>
                  <div className='overflow-x-auto'>
                    <table className='w-full border-collapse text-left'>
                      <thead>
                        <tr className='border-b border-[#F4F1EA]/10 bg-[#2C2420]/60'>
                          <th className='p-4 font-medium text-[#F4F1EA] md:p-6'>
                            Måling
                          </th>
                          <th className='w-32 p-4 font-medium text-[#F4F1EA] md:w-48 md:p-6'>
                            Medium
                          </th>
                          <th className='w-32 p-4 font-medium text-[#F4F1EA] md:w-48 md:p-6'>
                            Large
                          </th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-[#F4F1EA]/5 text-sm text-[#F4F1EA]/80 md:text-base'>
                        <TableRow
                          label='Total lengde (nakke til bunn)'
                          m='170 cm'
                          l='200 cm'
                        />
                        <TableRow
                          label='Brystvidde (flatmål)'
                          m='85 cm'
                          l='100 cm'
                        />
                        <TableRow
                          label='Armlengde (fra senter nakke)'
                          m='85 cm'
                          l='100 cm'
                        />
                        <TableRow
                          label='Bredde nederst (flatmål)'
                          m='66 cm'
                          l='75 cm'
                        />
                        <TableRow
                          label='Lengde på glidelås (V-hals)'
                          m='73 cm'
                          l='85.5 cm'
                        />
                        <TableRow
                          label='Høyde på hette'
                          m='35 cm'
                          l='35 cm'
                        />
                        <TableRow
                          label='Høyde på baklomme'
                          m='42 cm'
                          l='42 cm'
                        />
                      </tbody>
                    </table>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </article>
  )
}
