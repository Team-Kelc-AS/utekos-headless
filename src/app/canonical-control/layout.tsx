import { googleSansFlex } from '@/lib/fonts'
import type { ReactNode } from 'react'
import './control.css'

export const metadata = {
  title: 'Canonical Event Control | Utekos',
  robots: { index: false, follow: false }
}

export default function ControlLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <html
      lang='nb'
      suppressHydrationWarning
      className={googleSansFlex.variable}
    >
      <body>{children}</body>
    </html>
  )
}
