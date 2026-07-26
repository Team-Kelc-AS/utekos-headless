import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Route } from 'next'
import type { MagazineBlock } from '../types'

type MagazineCtaBlockProps = {
  block: Extract<MagazineBlock, { type: 'cta' }>
}

export function MagazineCtaBlock({
  block
}: MagazineCtaBlockProps) {
  return (
    <article className='my-16 rounded-lg border border-foreground/12 bg-background p-6 text-foreground shadow-[0_28px_90px_-62px_color-mix(in_oklch,var(--background)_90%,transparent)] sm:p-8'>
      <h2 className='font-google-sans max-w-2xl font-sans text-3xl leading-[0.95] font-bold text-balance sm:text-4xl'>
        {block.title}
      </h2>
      <p className='mt-4 max-w-2xl text-lg leading-[1.55] text-foreground/86'>
        {block.text}
      </p>
      <div className='mt-7 flex flex-wrap gap-3'>
        <BrandBadge
          asChild
          backgroundColor='var(--primary)'
          textColor='var(--primary-foreground)'
          className='group min-h-12 gap-2 border border-primary/40 px-6 py-3 font-utekos-text-medium text-base leading-[1.35] transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0'
        >
          <Link
            href={block.primary.href as Route}
            data-track={block.primary.trackingId}
          >
            {block.primary.label}
            <ArrowRight
              className='size-4 transition-transform group-hover:translate-x-1'
              aria-hidden
            />
          </Link>
        </BrandBadge>
        {block.secondary && (
          <BrandBadge
            asChild
            backgroundColor='var(--foreground)'
            textColor='var(--background)'
            className='min-h-12 border border-foreground/24 px-6 py-3 font-utekos-text-medium text-base leading-[1.35] transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0'
          >
            <Link
              href={block.secondary.href as Route}
              data-track={block.secondary.trackingId}
            >
              {block.secondary.label}
            </Link>
          </BrandBadge>
        )}
      </div>
    </article>
  )
}
