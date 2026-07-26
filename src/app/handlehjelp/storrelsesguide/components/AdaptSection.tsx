import { utekosData } from '../utils/data'
import { adaptFeatures } from '../utils/features'
import { SizeGuideSectionShell } from './SizeGuideSectionShell'

export function AdaptSection() {
  return (
    <SizeGuideSectionShell
      id='utekos-measurements'
      surface='card'
      ariaLabelledby='utekos-measurements-heading'
      className='rounded-lg'
    >
      <h2
        id='utekos-measurements-heading'
        className='font-google-sans max-w-4xl font-sans text-4xl leading-[1.05] font-bold text-inherit md:text-5xl lg:text-6xl'
      >
        Skapt for å tilpasses
      </h2>

      <div className='mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {adaptFeatures.map(feature => (
          <div
            key={feature.title}
            className='h-full rounded-lg border border-border bg-background p-6 text-left text-foreground shadow-[0_18px_46px_-38px_color-mix(in_oklab,var(--background)_90%,transparent)]'
          >
            <div className='flex items-center gap-4'>
              <div className='flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground'>
                <feature.Icon
                  className='size-6'
                  aria-hidden='true'
                />
              </div>
              <h3 className='font-utekos-text-medium text-lg'>
                {feature.title}
              </h3>
            </div>
            <p className='/90 mt-2 text-base leading-relaxed text-foreground/90'>
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      <div className='mt-12 w-full'>
        <div
          className='w-full overflow-x-auto rounded-lg text-left focus-visible:ring-2 focus-visible:ring-foreground/80 focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none'
          role='region'
          aria-label='Måletabell for Utekos Dun og Mikrofiber størrelser'
          tabIndex={0}
        >
          <div className='w-full max-lg:min-w-max'>
            <div className='overflow-hidden rounded-lg border border-border shadow-[0_22px_54px_-42px_color-mix(in_oklab,var(--background)_90%,transparent)]'>
              <table className='w-full divide-y divide-border bg-background text-foreground max-lg:min-w-xl'>
                <thead className='bg-secondary text-secondary-foreground'>
                  <tr>
                    <th
                      scope='col'
                      className='py-3.5 pr-3 pl-4 text-left font-utekos-text-medium text-sm sm:pl-6'
                    >
                      Måling
                    </th>
                    <th
                      scope='col'
                      className='px-3 py-3.5 text-center font-utekos-text-medium text-sm'
                    >
                      Medium
                    </th>
                    <th
                      scope='col'
                      className='px-3 py-3.5 text-center font-utekos-text-medium text-sm'
                    >
                      Large
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border'>
                  {utekosData.map(item => (
                    <tr
                      key={item.measurement}
                      className='transition-colors hover:bg-muted/35'
                    >
                      <td className='py-4 pr-3 pl-4 text-left font-utekos-text-medium text-sm whitespace-nowrap text-foreground sm:pl-6'>
                        {item.measurement}
                      </td>
                      <td className='px-3 py-4 text-center text-sm font-medium whitespace-nowrap text-foreground'>
                        {item.m}
                      </td>
                      <td className='px-3 py-4 text-center text-sm font-medium whitespace-nowrap text-foreground'>
                        {item.l}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </SizeGuideSectionShell>
  )
}
