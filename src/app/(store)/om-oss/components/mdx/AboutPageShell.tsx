import type { ReactNode } from 'react'

export function AboutPageShell({
  children
}: {
  children: ReactNode
}) {
  return (
    <article className='w-full bg-background text-foreground'>
      {children}
    </article>
  )
}
