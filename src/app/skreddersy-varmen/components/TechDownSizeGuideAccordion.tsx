import 'server-only'

import { SizeGuideAccordionTable } from '@/components/size-guide/SizeGuideAccordionTable'
import {
  TECH_DOWN_PUBLIC_SIZES,
  TECH_DOWN_PUBLIC_SIZE_DEFINITIONS
} from '@/lib/products/techDownSizes'
import { TechDownMobileSizeGuide } from './TechDownMobileSizeGuide'

const techDownSizeRows = [
  {
    label: 'Anbefalt høyde',
    values: TECH_DOWN_PUBLIC_SIZE_DEFINITIONS.map(
      size => size.heightGuide
    )
  },
  {
    label: 'Passform og romslighet',
    values: TECH_DOWN_PUBLIC_SIZE_DEFINITIONS.map(size =>
      size.fitGuidance.join(' ')
    )
  }
] as const

export function TechDownSizeGuideAccordion() {
  return (
    <SizeGuideAccordionTable
      id='tech-down-size-table'
      triggerLabel='Størrelsestabell'
      columns={TECH_DOWN_PUBLIC_SIZES}
      rows={techDownSizeRows}
      className='max-w-none'
      accordionClassName='rounded-2xl border-none bg-jungle-tone p-0 sm:rounded-2xl'
      triggerClassName='rounded-2xl bg-jungle-tone p-4 font-sans text-foreground hover:text-foreground md:p-6 min-[900px]:font-medium min-[900px]:text-[#F4F1EA]'
      tableHeaderClassName='bg-night'
      mobileContent={
        <TechDownMobileSizeGuide
          sizes={TECH_DOWN_PUBLIC_SIZE_DEFINITIONS}
        />
      }
    />
  )
}
