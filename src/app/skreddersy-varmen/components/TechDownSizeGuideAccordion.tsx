import { SizeGuideAccordionTable } from '@/components/size-guide/SizeGuideAccordionTable'
import { SIZE_GUIDANCE } from '../utils/constants'

const publicSizes = ['Middels', 'Stor', 'Ekstra stor'] as const

function requireGuidance(size: (typeof publicSizes)[number]) {
  const guidance = SIZE_GUIDANCE[size]

  if (!guidance) {
    throw new Error(`Missing Utekos TechDown™ size guidance for ${size}`)
  }

  return guidance
}

const publicSizeGuidance = publicSizes.map(requireGuidance)

const techDownSizeRows = [
  {
    label: 'Anbefalt høyde',
    values: publicSizeGuidance.map(guidance => guidance.height)
  },
  {
    label: 'Passform og romslighet',
    values: publicSizeGuidance.map(guidance => guidance.tips.join(' '))
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
    />
  )
}
