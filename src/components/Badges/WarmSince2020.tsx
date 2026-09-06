import { BadgeCheckIcon } from 'lucide-react'
import { InlineText } from '@/components/typography/TypographyInlineText'

export function WarmSince2020() {
  return (
    <aside
      aria-label='Utekos har laget funksjonell varme siden 2020'
      className='mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-foreground/16 bg-teal-800 px-6 py-2 shadow-[0_18px_48px_-34px_color-mix(in_oklch,var(--background)_85%,transparent)] ring-1 ring-foreground/8 backdrop-blur-md sm:mb-5 sm:gap-2.5 sm:px-4 md:px-8'
    >
      <span
        aria-hidden='true'
        className='flex size-6 shrink-0 items-center justify-center rounded-full border border-primary/35 bg-teal-500 text-background shadow-[inset_0_1px_0_color-mix(in_oklch,var(--primary-foreground)_20%,transparent)] sm:size-7'
      >
        <BadgeCheckIcon
          className='size-3.5 sm:size-4'
          strokeWidth={2.4}
        />
      </span>
      <InlineText className='font-sans font-utekos-text-medium text-xs leading-none tracking-normal whitespace-nowrap text-card-foreground sm:text-sm'>
        Funksjonell varme siden 2020
      </InlineText>
    </aside>
  )
}
