// SeasonsSection.tsx (Server Component - for hytte-siden)

import { Tabs } from './Tabs'
export function HytteSeasonsSection() {
  return (
    <article className='relative overflow-hidden bg-muted pt-24 pb-12 text-muted-foreground'>
      <div className='absolute inset-0 -z-10 opacity-20'>
        <div className='hytte-seasons-glow-pulse hytte-seasons-glow-bg absolute top-1/4 left-1/4 size-125 blur-3xl' />
        <div className='hytte-seasons-glow-pulse hytte-seasons-glow-bg hytte-seasons-glow-delay absolute right-1/4 bottom-1/4 size-125 blur-3xl' />
      </div>

      <div className='container mx-auto px-4'>
        <Tabs />
      </div>
    </article>
  )
}
