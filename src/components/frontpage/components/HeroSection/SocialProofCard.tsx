import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { InlineText } from '@/components/typography/TypographyInlineText'

interface SocialProofCardProps {
  readonly title: string
  readonly Icon: LucideIcon
  readonly iconWrapperClass: string
  readonly iconColorClass: string
  readonly hoverBorderClass: string
  readonly cardClass?: string
  readonly titleClass?: string
  readonly shineClass?: string
  readonly children: ReactNode
}

export function SocialProofCard({
  title,
  Icon,
  iconWrapperClass,
  iconColorClass,
  hoverBorderClass,
  cardClass,
  titleClass,
  shineClass,
  children
}: SocialProofCardProps) {
  const surfaceClass =
    cardClass ??
    'border-foreground/8 bg-foreground/[0.03] hover:bg-foreground/[0.05]'

  const shineStyle = shineClass ?? 'via-foreground/12'

  return (
    <article
      className={`group relative overflow-hidden rounded-xl border p-4 transition-colors duration-300 sm:p-5 ${hoverBorderClass} ${surfaceClass}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 -skew-x-12 bg-linear-to-r from-transparent ${shineStyle} to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none`}
        aria-hidden='true'
      />

      <div className='relative flex flex-col items-center text-center'>
        <div
          className={`mb-3 flex size-12 items-center justify-center rounded-full ${iconWrapperClass}`}
        >
          <Icon className={`size-5 ${iconColorClass}`} />
        </div>
        <InlineText
          className={`font-google-sans text-lg leading-[0.95] font-bold tracking-normal ${titleClass ?? 'text-foreground'}`}
        >
          {title}
        </InlineText>
        {children}
      </div>
    </article>
  )
}
