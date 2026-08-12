import { SizeGuideAccordionTable } from '@/components/size-guide/SizeGuideAccordionTable'
import { TechDownMobileSizeGuide } from './TechDownMobileSizeGuide'
import { SIZE_GUIDANCE } from '../utils/constants'

const publicSizes = ['Middels', 'Stor', 'Ekstra stor'] as const

function requireGuidance(size: (typeof publicSizes)[number]) {
  const guidance = SIZE_GUIDANCE[size]

  if (!guidance) {
    throw new Error(
      `Missing Utekos TechDown™ size guidance for ${size}`
    )
  }

  return guidance
}

const publicSizeGuidance = publicSizes.map(size => ({
  size,
  ...requireGuidance(size)
}))

const techDownSizeRows = [
  {
    label: 'Anbefalt høyde',
    values: publicSizeGuidance.map(guidance => guidance.height)
  },
  {
    label: 'Passform og romslighet',
    values: publicSizeGuidance.map(guidance =>
      guidance.tips.join(' ')
    )
  }
] as const

export function TechDownSizeGuideAccordion() {
  return (
    <SizeGuideAccordionTable
      id='tech-down-size-table'
      triggerLabel='Størrelsestabell'
      columns={publicSizes}
      rows={techDownSizeRows}
      className='mt-5 max-w-none'
      accordionClassName='rounded-2xl border border-foreground/15 bg-jungle px-3 sm:rounded-xl sm:border-none sm:bg-[#00453e] sm:px-2 min-[900px]:px-6'
      triggerClassName='bg-jungle px-2 py-4 font-utekos-text text-foreground hover:text-foreground sm:bg-[#00453e] sm:py-6 min-[900px]:font-medium min-[900px]:text-[#F4F1EA]'
      tableHeaderClassName='bg-background'
      mobileContent={
        <TechDownMobileSizeGuide sizes={publicSizeGuidance} />
      }
    />
  )
}
