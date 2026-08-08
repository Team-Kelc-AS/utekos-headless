import { returnPolicy } from '@/lib/policies/returnPolicy'
import type { Metadata } from 'next'

export const returnPolicyPageMetadata = {
  metadataBase: new URL('https://utekos.no'),
  title: 'Frakt, retur og refusjon',
  description: `Les Utekos sine frakt- og returvilkår: ${returnPolicy.returnWindowDays} dagers angrerett fra mottak, kundebetalt returfrakt, returadresse og refusjon innen ${returnPolicy.processRefundBusinessDays.minimum}–${returnPolicy.processRefundBusinessDays.maximum} virkedager etter mottak.`,
  alternates: { canonical: '/frakt-og-retur' },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      'index': true,
      'follow': true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1
    }
  },
  openGraph: {
    title: 'Frakt, retur og refusjon hos Utekos',
    description:
      'Se returfrist, returkostnader, returadresse og behandlingstid for kjøp hos Utekos.',
    url: '/frakt-og-retur',
    siteName: 'Utekos',
    images: [
      {
        url: '/og-image-frakt-og-retur.jpg',
        width: 1200,
        height: 630,
        alt: 'En Utekos-pakke klar for sending.'
      }
    ],
    locale: 'nb_NO',
    type: 'website'
  }
} satisfies Metadata
