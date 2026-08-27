import type { ReactNode } from 'react'

type TechnologyGroupProps = {
  children: ReactNode
  title: string
}

export function TechnologyGroup({
  children,
  title
}: TechnologyGroupProps) {
  return (
    <article>
      <h2 className='mb-8 border-b border-border pb-4 font-google-sans text-sm font-bold tracking-normal text-muted-foreground'>
        {title}
      </h2>
      <div className='space-y-8'>{children}</div>
    </article>
  )
}
