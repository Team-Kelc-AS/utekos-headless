// Path: src/app/handlehjelp/sammenlign-modeller/components/DeepDiveSection.tsx
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { deepDiveSections } from '../utils/comparisonData'

export function DeepDiveSection() {
  return (
    <article
      aria-labelledby='sammenlign-modeller-deep-dive-heading'
      className='dark:bg-dark-background bg-background py-20 text-foreground sm:py-28'
    >
      <div className='mx-auto max-w-7xl px-[6vw]'>
        <div className='mx-auto w-full max-w-3xl text-center md:max-w-4xl'>
          <BrandBadge
            label='Slik velger du'
            tone='commerce-primary'
            className='mb-6 px-6 py-3 text-sm'
          />
          <h2
            id='sammenlign-modeller-deep-dive-heading'
            className='mx-auto w-full text-foreground'
          >
            Se etter vær, vekt og hvor plagget skal bo
          </h2>
          <p className='utekos-section-lead dark:text-dark-muted-foreground mx-auto mt-6 max-w-2xl text-muted-foreground'>
            De fleste velger riktig når de starter med bruk, ikke
            materiale. Her er de viktigste valgene forklart kort.
          </p>
        </div>

        <ul className='dark:divide-dark-foreground/20 dark:border-dark-foreground/20 mt-14 divide-y divide-foreground/20 border-y border-foreground/20'>
          {deepDiveSections.map(section => (
            <li key={section.title}>
              <article className='mx-auto max-w-4xl py-10 lg:py-14'>
                <p className='dark:text-dark-muted-foreground text-sm font-medium text-muted-foreground'>
                  {section.eyebrow}
                </p>
                <h3 className='font-google-sans mt-4 font-sans text-3xl leading-[0.98] font-bold text-foreground sm:text-4xl'>
                  {section.title}
                </h3>

                <ul className='leading-text-paragraph dark:marker:text-dark-primary mt-7 list-disc space-y-4 pl-5 text-base font-medium text-foreground marker:text-primary sm:text-lg'>
                  <li>{section.body}</li>
                  {section.points.map(point => (
                    <li
                      key={point}
                      className='dark:text-dark-muted-foreground text-muted-foreground'
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
