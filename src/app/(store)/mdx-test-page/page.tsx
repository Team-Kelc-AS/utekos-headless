import type { ComponentPropsWithoutRef } from 'react'
import type { MDXComponents } from 'mdx/types'
import Welcome from '@/markdown/welcome.mdx'

function CustomH1({ children }: ComponentPropsWithoutRef<'h1'>) {
  return (
    <h1 className='font-utekos-text-medium text-4xl text-foreground'>
      {children}
    </h1>
  )
}

const overrideComponents = {
  h1: CustomH1
} satisfies MDXComponents

export default function Page() {
  return <Welcome components={overrideComponents} />
}
