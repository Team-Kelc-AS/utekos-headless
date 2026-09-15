import { cn } from '@/lib/utils'

/** Shared shell so SocialProof cards stay identical across breakpoints. */
export function socialProofCardClassName(
  ...classNames: Array<string | undefined>
) {
  return cn(
    'relative mx-auto aspect-video w-full max-w-none gap-0 overflow-hidden rounded-lg bg-black p-0 py-0 shadow-[0_18px_48px_-36px_color-mix(in_oklch,var(--card)_88%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_54px_-38px_color-mix(in_oklch,var(--card)_92%,transparent)]',
    ...classNames
  )
}
