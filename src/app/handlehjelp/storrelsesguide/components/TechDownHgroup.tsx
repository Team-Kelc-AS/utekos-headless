import { techDownFeatures } from '../utils/techDownFeatures'
import { SizeGuideSectionShell } from './SizeGuideSectionShell'

export function TechDownHgroup() {
  return (
    <SizeGuideSectionShell
      id='tech-down-details'
      surface='muted'
      ariaLabelledby='tech-down-details-heading'
      className='my-4 rounded-xl'
    >
      <h2
        id='tech-down-details-heading'
        className='mb-4 max-w-4xl font-sans text-4xl leading-[1.05] font-bold text-foreground md:text-5xl lg:text-6xl'
      >
        Gjennomtenkte detaljer
      </h2>

      <div className='mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {techDownFeatures.map(feature => (
          <div
            key={feature.title}
            className='h-full rounded-lg border border-border bg-card p-6 text-left text-card-foreground shadow-[0_18px_46px_-38px_color-mix(in_oklab,var(--background)_90%,transparent)]'
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
            <p className='/90 mt-2 text-base leading-relaxed text-inherit/90'>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </SizeGuideSectionShell>
  )
}
