import { MaintenanceJsonLd } from './MaintenanceJsonLd'
import type { ReactNode } from 'react'
export default function MaintenanceLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <>
      <article>
        <MaintenanceJsonLd />
        <div className='relative isolate min-h-screen w-full bg-background text-foreground'>
          <div className='relative z-10'>{children}</div>
        </div>
      </article>
    </>
  )
}
