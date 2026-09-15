import { BobilJsonLd } from './components/BobilJsonLd'
import { BobilArticleJsonLdScript } from './components/BobilArticleJsonLd'
import type { ReactNode } from 'react'

export default function BobilLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <BobilJsonLd />
      <BobilArticleJsonLdScript />
      {children}
    </>
  )
}
