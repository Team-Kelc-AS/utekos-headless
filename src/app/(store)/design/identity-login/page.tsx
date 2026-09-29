import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { IdentityLoginPreview } from './IdentityLoginPreview'

export const metadata: Metadata = {
  title: 'Innlogging – forhåndsvisning',
  robots: { index: false, follow: false }
}

export default function IdentityLoginPreviewPage() {
  if (
    process.env.NODE_ENV !== 'development' &&
    process.env.VERCEL_ENV !== 'preview'
  ) {
    notFound()
  }

  return <IdentityLoginPreview />
}
