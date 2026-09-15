import { TabsContent } from '@/components/ui/tabs'
import { DOWN_DO_ITEMS, DOWN_DONT_ITEMS } from '../constants'
import { ProductCareCardRail } from './ProductCareCardRail'
import { ProductCareGuideCard } from './ProductCareGuideCard'

export function ProductCareUtekosDun() {
  return (
    <TabsContent value='dun' className='mt-8'>
      <div className='mb-7 max-w-3xl sm:mb-8'>
        <h3 className='font-google-sans text-left font-sans text-5xl leading-[0.95] font-bold text-foreground sm:text-5xl'>
          Utekos Dun™
        </h3>
        <p className='/90 mt-5 text-left font-utekos-text-medium text-lg leading-8 text-foreground/90'>
          Skånsom behandling bevarer den luftige varmen. Dun er
          et naturmateriale som belønner tålmodighet og straffer
          hastverk.
        </p>
      </div>

      <ProductCareCardRail ariaLabel='Pleiekort for Utekos Dun'>
        <li className='snap-start'>
          <ProductCareGuideCard
            eyebrow='Dunpleie'
            title='Anbefalt'
            items={DOWN_DO_ITEMS}
          />
        </li>
        <li className='snap-start'>
          <ProductCareGuideCard
            eyebrow='Dunpleie'
            title='Unngå'
            items={DOWN_DONT_ITEMS}
          />
        </li>
        <li className='snap-start'>
          <ProductCareGuideCard
            eyebrow='Tørking'
            title='Tørking er avgjørende'
            items={[
              'Lav varme',
              'To-tre tørkeballer',
              'Rist underveis',
              'Tørk helt ferdig'
            ]}
          />
        </li>
        <li className='snap-start'>
          <ProductCareGuideCard
            eyebrow='Oppbevaring'
            title='Gi dunet luft'
            items={[
              'Heng på henger',
              'Tørt og luftig skap',
              'Unngå plasttrekk',
              'Ikke langtidskomprimer'
            ]}
          />
        </li>
      </ProductCareCardRail>
    </TabsContent>
  )
}
