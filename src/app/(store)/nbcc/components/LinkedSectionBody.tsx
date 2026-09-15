import { NBCC_LOGIN_URL } from '../constants'
import type { NbccAiSummarySectionBodyProps } from '../types'

export function LinkedSectionBody({
  intent,
  section
}: NbccAiSummarySectionBodyProps) {
  if (!section.body) return null

  const shouldLinkNbccLogin =
    intent === 'how-to-use' &&
    section.title.toLowerCase() === 'hvor finner jeg koden?' &&
    section.body.includes('Min Side hos NBCC')

  if (!shouldLinkNbccLogin) {
    return (
      <p className='mt-2 text-sm leading-6 text-[#f5efe4]/78'>
        {section.body}
      </p>
    )
  }

  const [before, after] = section.body.split('Min Side hos NBCC')

  return (
    <p className='mt-2 text-sm leading-6 text-[#f5efe4]/78'>
      {before}
      <a
        href={NBCC_LOGIN_URL}
        target='_blank'
        rel='noreferrer'
        className='font-utekos-text-medium text-[#f0c36a] underline decoration-[#f0c36a]/40 underline-offset-4 hover:text-[#ffd886]'
      >
        Min Side hos NBCC
      </a>
      {after}
    </p>
  )
}
