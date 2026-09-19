import { Google_Sans_Flex } from 'next/font/google'
import type { ReactNode } from 'react'
import './control.css'

const font = Google_Sans_Flex({
  subsets: ['latin'],
  weight: ['500', '800'],
  display: 'swap',
  variable: '--control-font'
})

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
    <html lang='nb' className={font.variable}>
      <body>{children}</body>
    </html>
  )
}
