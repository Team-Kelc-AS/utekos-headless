import UtekosWordmark from '@/components/BrandComponents/utils/UtekosWordmark'
import Image from 'next/image'
import { AboutBadge } from './AboutBadge'

type AboutHeroProps = {
  eyebrow: string
  title: string
  description: string
  imageAlt: string
  imageSrc: string
}

export function AboutHero({
  eyebrow,
  title,
  description,
  imageAlt,
  imageSrc
}: AboutHeroProps) {
  return (
    <article className='relative isolate flex min-h-[82svh] items-center justify-center overflow-hidden bg-background text-foreground md:min-h-[89vh]'>
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        quality={95}
        sizes='100vw'
        className='-z-20 object-cover'
      />
      <div className='absolute inset-0 -z-10 bg-background/68' />
      <div className='absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-linear-to-t from-background via-background/80 to-transparent' />

      <div className='mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-7 px-4 py-24 text-center sm:px-6 lg:px-8'>
        <h1 aria-label={title} className='leading-none'>
          <span className='sr-only'>{title}</span>
          <UtekosWordmark
            aria-hidden='true'
            className='h-auto w-[min(82vw,22rem)] text-foreground sm:w-[min(76vw,40rem)] lg:w-[min(72vw,52rem)]'
          />
        </h1>
        <AboutBadge tone='jungle'>{eyebrow}</AboutBadge>
        <p className='/90 mx-auto max-w-3xl text-xl leading-8 text-balance text-foreground/90 sm:text-3xl sm:leading-10'>
          {description}
        </p>
      </div>
    </article>
  )
}
