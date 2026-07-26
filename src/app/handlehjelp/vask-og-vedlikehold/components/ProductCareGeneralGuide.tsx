import { ProductCareCardRail } from './ProductCareCardRail'
import { ProductCareGuideCard } from './ProductCareGuideCard'

interface CareStep {
  id: string
  step: string
  title: string
  items: string[]
}

const steps: CareStep[] = [
  {
    id: 'forberedelse',
    step: 'Steg 1',
    title: 'Forberedelse',
    items: [
      'Lukk glidelåser',
      'Fest borrelås',
      'Tøm alle lommer',
      'Vreng før vask'
    ]
  },
  {
    id: 'vask',
    step: 'Steg 2',
    title: 'Vask',
    items: [
      'Skånsomt program',
      'Kaldt eller lunkent vann',
      'Mildt vaskemiddel',
      'Unngå tøymykner'
    ]
  },
  {
    id: 'torking',
    step: 'Steg 3',
    title: 'Tørking',
    items: [
      'Lav varme for dun',
      'Bruk tørkeballer',
      'Lufttørk mikrofiber',
      'Rist plagget underveis'
    ]
  },
  {
    id: 'oppbevaring',
    step: 'Steg 4',
    title: 'Oppbevaring',
    items: [
      'Bruk stødig henger',
      'Velg tørt skap',
      'Gi dunet luft',
      'Unngå lang kompresjon'
    ]
  }
]

export function ProductCareGeneralGuide() {
  return (
    <article
      aria-labelledby='generell-guide-heading'
      className='max-w-6xl scroll-mt-24'
    >
      <div className='mb-10 text-center'>
        <h2
          id='generell-guide-heading'
          className='font-google-sans text-left font-sans text-5xl leading-[0.95] font-bold text-foreground sm:text-5xl'
        >
          Slik tar du vare på plagget
        </h2>
        <p className='/90 mt-5 text-left font-utekos-text-medium text-lg leading-8 text-foreground/90'>
          Fire steg som gjelder for alle Utekos-plagg.
          Materialspesifikke detaljer finner du lenger ned.
        </p>
      </div>

      <ProductCareCardRail
        ariaLabel='Fire generelle vedlikeholdssteg'
        layout='flush'
      >
        {steps.map(({ id, step, title, items }) => (
          <li key={id} id={id} className='scroll-mt-24'>
            <ProductCareGuideCard
              eyebrow={step}
              title={title}
              items={items}
            />
          </li>
        ))}
      </ProductCareCardRail>
    </article>
  )
}
