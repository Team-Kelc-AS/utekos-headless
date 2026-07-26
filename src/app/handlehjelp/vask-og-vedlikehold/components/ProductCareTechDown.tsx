import { TabsContent } from '@/components/ui/tabs'
import { ProductCareCardRail } from './ProductCareCardRail'
import { ProductCareGuideCard } from './ProductCareGuideCard'

const techDownDoItems = [
  'Skånsom maskinvask',
  'Mildt vaskemiddel',
  'Lukk glidelåser',
  'Lufttørk helt'
] as const

const techDownDontItems = [
  'Tøymykner',
  'Blekemidler',
  'Høy varme',
  'Lang kompresjon'
] as const

export function ProductCareTechDown() {
  return (
    <TabsContent value='techdown' className='mt-8'>
      <div className='mb-7 max-w-3xl sm:mb-8'>
        <h3 className='font-utekos-text-medium text-2xl text-foreground'>
          Utekos TechDown™
        </h3>
        <p className='/90 mt-3 text-base leading-relaxed text-foreground/90'>
          TechDown™ er laget for ukomplisert bruk over tid.
          Skånsom vask, mildt vaskemiddel og rolig lufttørking
          bevarer både Luméa™-ytterstoffet og
          CloudWave™-isolasjonens spenst.
        </p>
      </div>

      <ProductCareCardRail ariaLabel='Pleiekort for Utekos TechDown'>
        <li className='snap-start'>
          <ProductCareGuideCard
            eyebrow='TechDown-pleie'
            title='Anbefalt'
            items={techDownDoItems}
          />
        </li>
        <li className='snap-start'>
          <ProductCareGuideCard
            eyebrow='TechDown-pleie'
            title='Unngå'
            items={techDownDontItems}
          />
        </li>
        <li className='snap-start'>
          <ProductCareGuideCard
            eyebrow='Tørking'
            title='Rask lufttørk'
            items={[
              'Heng på henger',
              'God lufting',
              'Ingen høy varme',
              'Tørt før bruk'
            ]}
          />
        </li>
        <li className='snap-start'>
          <ProductCareGuideCard
            eyebrow='Isolasjon'
            title='Bevar spensten'
            items={[
              'Lagre tørt',
              'Gi isolasjonen luft',
              'Bruk pakksekk kort',
              'Rist etter vask'
            ]}
          />
        </li>
      </ProductCareCardRail>
    </TabsContent>
  )
}
