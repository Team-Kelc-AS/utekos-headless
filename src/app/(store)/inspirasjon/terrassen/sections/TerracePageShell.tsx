import type { ReactNode } from 'react'
import { TerraceMotionProvider } from './TerraceMotion'

export function TerracePageShell({
  children
}: {
  children: ReactNode
}) {
  return (
    <TerraceMotionProvider>
      <article className='bg-section overflow-x-clip text-foreground'>
        {children}
      </article>
    </TerraceMotionProvider>
  )
}
