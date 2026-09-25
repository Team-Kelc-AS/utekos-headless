import type { NbccAiSummarySectionBodyProps } from '../types'

export function LinkedSectionBody({
  section
}: NbccAiSummarySectionBodyProps) {
  if (!section.body) return null

  return (
    <p className='mt-2 text-sm leading-6 text-[#f5efe4]/78'>
      {section.body}
    </p>
  )
}
