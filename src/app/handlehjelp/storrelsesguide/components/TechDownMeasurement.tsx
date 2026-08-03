import { techDownData } from '../utils/data'
import { SizeGuideSectionShell } from './SizeGuideSectionShell'

export function TechDownMeasurement() {
  return (
    <SizeGuideSectionShell
      id='tech-down-measurements'
      surface='jungle'
      ariaLabelledby='tech-down-measurements-heading'
      className='rounded-xl'
    >
      <h2
        id='tech-down-measurements-heading'
        className='font-google-sans max-w-5xl rounded-lg font-sans text-4xl leading-[1.05] font-bold text-inherit md:text-5xl lg:text-6xl'
      >
        Måletabell for TechDown™
      </h2>
      <p className='/90 mt-5 max-w-3xl text-lg leading-relaxed text-inherit/90'>
        Bruk målene som presis kontroll når du velger mellom
        Liten, Medium og Large.
      </p>

      <div className='mt-12 w-full'>
        <div
          className='w-full overflow-x-auto rounded-lg focus-visible:ring-2 focus-visible:ring-foreground/80 focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none'
          role='region'
          aria-label='Måletabell for TechDown størrelser'
          tabIndex={0}
        >
          <div className='w-full max-lg:min-w-max'>
            <div className='overflow-hidden rounded-lg border border-border shadow-[0_22px_54px_-42px_color-mix(in_oklab,var(--background)_90%,transparent)]'>
              <table className='w-full divide-y divide-border bg-background text-foreground max-lg:min-w-2xl'>
                <thead className='bg-muted text-foreground'>
                  <tr>
                    <th
                      scope='col'
                      className='bg-muted py-3.5 pr-3 pl-4 text-left font-utekos-text-medium text-sm sm:pl-6'
                    >
                      Måling
                    </th>
                    <th
                      scope='col'
                      className='bg-muted px-3 py-3.5 text-center font-utekos-text-medium text-sm'
                    >
                      Liten
                    </th>
                    <th
                      scope='col'
                      className='bg-muted px-3 py-3.5 text-center font-utekos-text-medium text-sm'
                    >
                      Middels
                    </th>
                    <th
                      scope='col'
                      className='bg-muted px-3 py-3.5 text-center font-utekos-text-medium text-sm'
                    >
                      Stor
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border'>
                  {techDownData.map(item => (
                    <tr key={item.measurement}>
                      <td className='py-4 pr-3 pl-4 text-left text-sm font-medium whitespace-nowrap text-foreground sm:pl-6'>
                        {item.measurement}
                      </td>
                      <td className='px-3 py-4 text-center text-sm whitespace-nowrap text-foreground'>
                        {item.liten}
                      </td>
                      <td className='px-3 py-4 text-center text-sm whitespace-nowrap text-foreground'>
                        {item.middels}
                      </td>
                      <td className='px-3 py-4 text-center text-sm whitespace-nowrap text-foreground'>
                        {item.stor}
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
