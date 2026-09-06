import type { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Farger',
  robots: { index: false, follow: false }
}

export default function DesignLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <div className='min-h-screen w-full bg-background px-2 py-8 text-foreground sm:px-3 lg:px-4'>
      <div className='max-w-9xl mx-auto w-full'>{children}</div>
    </div>
  )
}
