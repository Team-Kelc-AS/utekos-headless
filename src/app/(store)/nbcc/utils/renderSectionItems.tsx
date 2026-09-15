import type { NbccAiSummarySection } from '../types'

export function renderSectionItems(
  section: NbccAiSummarySection
) {
  if (!section.items?.length) return null

  if (section.style === 'steps') {
    return (
      <ol className='mt-3 space-y-2.5'>
        {section.items.map((item, index) => (
          <li
            key={item}
            className='flex gap-3 text-sm leading-6 text-[#f5efe4]/82'
          >
            <span className='font-google-sans mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f0c36a]/15 text-[11px] font-bold text-[#f0c36a]'>
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    )
  }

  return (
    <ul className='mt-3 space-y-2.5'>
      {section.items.map(item => (
        <li
          key={item}
          className='flex items-start gap-3 text-sm leading-6 text-[#f5efe4]/82'
        >
          <span
            aria-hidden
            className='mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f0c36a]'
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
