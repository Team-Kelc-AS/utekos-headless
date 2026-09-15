import { TabsContent } from '@/components/ui/tabs'
import { ProductCareCardRail } from './ProductCareCardRail'
import { ProductCareGuideCard } from './ProductCareGuideCard'

const doItems = [
  'Maks 40 °C',
  'Mildt vaskemiddel',
  'Lufttørk helst',
  'Luft godt etter bruk'
] as const

const dontItems = [
  'Blekemidler',
  'Tøymykner',
  'Kjemisk rens',
  'Høy varme'
] as const

export function ProductCareComfyrobe() {
  return (
    <TabsContent value='comfyrobe' className='mt-8'>
      <div className='mb-7 max-w-3xl sm:mb-8'>
        <h3 className='font-utekos-text-medium text-2xl text-foreground'>
          Comfyrobe™
        </h3>
        <p className='/90 mt-3 text-base leading-relaxed text-foreground/90'>
          Comfyrobe kombinerer myk komfort med beskyttende
          DWR-behandling. Riktig pleie bevarer både følelsen mot
          huden og evnen til å holde vann unna.
        </p>
      </div>

      <ProductCareCardRail ariaLabel='Pleiekort for Comfyrobe'>
        <li className='snap-start'>
          <ProductCareGuideCard
            eyebrow='Comfyrobe-pleie'
            title='Anbefalt'
            items={doItems}
          />
        </li>
        <li className='snap-start'>
          <ProductCareGuideCard
            eyebrow='Comfyrobe-pleie'
            title='Unngå'
            items={dontItems}
          />
        </li>
        <li className='snap-start'>
          <ProductCareGuideCard
            eyebrow='Ytterstoff'
            title='Frisk opp DWR'
            items={[
              'Vask plagget rent',
              'Tørk helt først',
              'Bruk DWR-spray',
              'Luft etter salt og klor'
            ]}
          />
        </li>
        <li className='snap-start'>
          <ProductCareGuideCard
            eyebrow='Oppbevaring'
            title='Beskytt komforten'
            items={[
              'Heng luftig',
              'Hold plagget tørt',
              'Unngå skarp varme',
              'Lukk før lagring'
            ]}
          />
        </li>
      </ProductCareCardRail>
    </TabsContent>
  )
}
