import { AspectRatio } from '@/components/ui/aspect-ratio'
import KystHus from '@public/Utekos-TechDown-Kysthus-612x705.png'
import { cn } from '@/lib/utils'
import Image from 'next/image'

export function AspectRatioCustom({
  children = null,
  className,
  ratio = 141 / 122
}: {
  children?: React.ReactNode
  className?: string
  ratio?: number
}) {
  return (
    <AspectRatio ratio={ratio} className={className}>
      {children}
    </AspectRatio>
  )
}

const justerFormNytLineClassName =
  'block max-w-full font-google-sans font-bold font-[family-name:var(--font-google-sans)] tracking-tight'
const justerFormNytTextSizeClassName =
  'text-[clamp(4.5rem,10.5vw,12rem)]'
const tightLineHeightClassName = 'leading-[0.82]'

export function CardAspectRatioCustomContent({
  className
}: {
  className?: string
}) {
  return (
    <AspectRatioCustom
      className={cn(
        className ?? 'w-full',
        '@container flex min-w-0 items-center justify-center overflow-hidden bg-jungle'
      )}
      ratio={141 / 122}
    >
      <div className='flex h-full w-full max-w-full min-w-0 items-center justify-center px-4 sm:px-6'>
        <div className='flex w-fit flex-col items-start text-left'>
          <span
            className={cn(
              justerFormNytLineClassName,
              justerFormNytTextSizeClassName,
              'text-sidebar-foreground',
              tightLineHeightClassName
            )}
          >
            JUSTER.
          </span>
          <span
            className={cn(
              justerFormNytLineClassName,
              justerFormNytTextSizeClassName,
              'text-sidebar-foreground',
              tightLineHeightClassName
            )}
          >
            FORM.
          </span>
          <span
            className={cn(
              justerFormNytLineClassName,
              justerFormNytTextSizeClassName,
              'text-primary',
              tightLineHeightClassName
            )}
          >
            NYT.
          </span>
        </div>
      </div>
    </AspectRatioCustom>
  )
}

export function CardAspectRatioCustom({
  className
}: {
  className?: string
  image?: string
}) {
  return (
    <AspectRatioCustom
      ratio={141 / 122}
      className={cn(
        className,
        'flex items-center justify-center overflow-hidden bg-jungle'
      )}
    >
      <Image
        src={KystHus}
        alt='Kysthus med Utekos-varme – juster, form og nyt uteplassen'
        className='rounded-lg object-contain'
        style={{ transform: 'scale(0.9)' }}
        width={612}
        height={705}
      />
    </AspectRatioCustom>
  )
}
