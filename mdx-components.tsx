import type { MDXComponents } from 'mdx/types'
import Image, { type ImageProps } from 'next/image'
import { SizeGuideCallout } from '@/components/size-guide/SizeGuideCallout'
import { KnowledgeCallout } from '@/components/knowledge/KnowledgeCallout'
import { H1 } from '@/components/typography/TypographyH1'
import { H2 } from '@/components/typography/TypographyH2'
import { H3 } from '@/components/typography/TypographyH3'
import { H4 } from '@/components/typography/TypographyH4'
import { P } from '@/components/typography/TypographyP'

const components = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  p: P,
  KnowledgeCallout,
  SizeGuideCallout,
  img: props => {
    const imageProps = props as ImageProps
    return (
      <Image
        sizes='100vw'
        className='h-auto max-w-full'
        {...imageProps}
        alt={imageProps.alt ?? ''}
      />
    )
  }
} satisfies MDXComponents

export function useMDXComponents(): MDXComponents {
  return components
}
