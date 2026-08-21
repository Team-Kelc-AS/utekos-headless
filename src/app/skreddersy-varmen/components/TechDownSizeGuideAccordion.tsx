import { SizeGuideAccordionTable } from '@/components/size-guide/SizeGuideAccordionTable'
import { TECH_DOWN_PUBLIC_SIZES } from '@/lib/products/presentation/techDownSizeContract'
import { TechDownMobileSizeGuide } from './TechDownMobileSizeGuide'
import { SIZE_GUIDANCE } from '../utils/constants'

const publicSizes = TECH_DOWN_PUBLIC_SIZES

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
      className='max-w-none'
      accordionClassName='rounded-2xl border-none bg-jungle-tone p-0 sm:rounded-2xl'
      triggerClassName='rounded-2xl bg-jungle-tone p-4 font-sans text-foreground hover:text-foreground md:p-6 min-[900px]:font-medium min-[900px]:text-[#F4F1EA]'
      tableHeaderClassName='bg-night'
      mobileContent={
        <TechDownMobileSizeGuide sizes={publicSizeGuidance} />
      }
    />
  )
}
