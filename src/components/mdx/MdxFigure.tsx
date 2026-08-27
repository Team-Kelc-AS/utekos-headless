import { cn } from '@/lib/utils'
import Image, { type ImageProps } from 'next/image'
import type { ReactNode } from 'react'

type MdxFigureProps = Omit<ImageProps, 'alt' | 'className'> & {
  alt: string
  caption?: ReactNode
  className?: string
  imageClassName?: string
}

export function MdxFigure({
  alt,
  caption,
  className,
  imageClassName,
  ...imageProps
}: MdxFigureProps) {
  return (
    <figure className={cn('grid gap-3', className)}>
      <div className='overflow-hidden rounded-2xl bg-card/35 p-1.5 ring-1 ring-foreground/8'>
        <Image
          alt={alt}
          className={cn(
            'h-auto w-full rounded-[0.75rem] object-cover',
            imageClassName
          )}
          {...imageProps}
        />
      </div>
      {caption ?
        <figcaption className='max-w-[65ch] font-utekos-text text-sm leading-relaxed text-foreground/65'>
          {caption}
        </figcaption>
      : null}
    </figure>
  )
}
