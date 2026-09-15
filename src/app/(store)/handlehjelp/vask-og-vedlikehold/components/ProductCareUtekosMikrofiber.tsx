import { TabsContent } from '@/components/ui/tabs'
import {
  MICROFIBER_DO_ITEMS,
  MICROFIBER_DONT_ITEMS
} from '../constants'
import { ProductCareCardRail } from './ProductCareCardRail'
import { ProductCareGuideCard } from './ProductCareGuideCard'

export function ProductCareUtekosMikrofiber() {
  return (
    <TabsContent value='mikrofiber' className='mt-8'>
      <div className='mb-7 max-w-3xl sm:mb-8'>
        <h3 className='font-utekos-text-medium text-2xl text-foreground'>
          Utekos Mikrofiber™
        </h3>
        <p className='/90 mt-3 text-base leading-relaxed text-foreground/90'>
          Slitesterkt, raskt å tørke og enkelt å vedlikeholde.
          Mikrofiber takler hverdagsbruk uten å miste form, så
          lenge du holder varmen unna.
        </p>
      </div>

      <ProductCareCardRail ariaLabel='Pleiekort for Utekos Mikrofiber'>
        <li className='snap-start'>
          <ProductCareGuideCard
            eyebrow='Mikrofiberpleie'
            title='Anbefalt'
            items={MICROFIBER_DO_ITEMS}
          />
        </li>
        <li className='snap-start'>
          <ProductCareGuideCard
            eyebrow='Mikrofiberpleie'
            title='Unngå'
            items={MICROFIBER_DONT_ITEMS}
          />
        </li>
        <li className='snap-start'>
          <ProductCareGuideCard
            eyebrow='Tørking'
            title='Lufttørk riktig'
            items={[
              'Heng på henger',
              'God luft rundt plagget',
              'Ingen høy varme',
              'Helt tørt før lagring'
            ]}
          />
        </li>
        <li className='snap-start'>
          <ProductCareGuideCard
            eyebrow='Oppbevaring'
            title='Hold formen'
            items={[
              'Heng etter bruk',
              'Lagre tørt',
              'Unngå skarpe bretter',
              'Luft mellom vask'
            ]}
          />
        </li>
      </ProductCareCardRail>
    </TabsContent>
  )
}
