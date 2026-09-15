import type { Metadata } from 'next'

export const siteMetadata: Metadata = {
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
  metadataBase: new URL('https://utekos.no'),
  title: 'Utekos - Skreddersy varmen',
  description:
    'Utekos er en merkevare som designer yttertøy som kan justeres og formes etter behov. Opplev ompromissløs komfort og overlegen allsidighet. Perfekt for hytte, bobil, camping og terrasseliv.',
  alternates: { canonical: '/' },
  applicationName: 'Utekos',
  category: 'Yttertøy',
  manifest: '/manifest.webmanifest',
  authors: [{ name: 'Utekos', url: 'https://utekos.no' }],
  creator: 'Utekos',
  publisher: 'Utekos',
  formatDetection: {
    email: true,
    address: true,
    telephone: true
  },
  facebook: { appId: '1154247890253046' },
  pinterest: { richPin: true },
  appleWebApp: {
    capable: true,
    title: 'Utekos',
    statusBarStyle: 'default'
  },
  openGraph: {
    type: 'website',
    locale: 'no_NO',
    url: 'https://utekos.no',
    siteName: 'Utekos',
    title: 'Utekos - Skreddersy varmen',
    description:
      'Utekos er en merkevare som designer yttertøy som kan justeres og formes etter behov. Opplev kompromissløs komfort og overlegen allsidighet. Perfekt for hytteliv, bobil, båt og terrasseliv.',
    images: {
      url: 'https://utekos.no/og-utekos_brand.jpg',
      width: 1200,
      height: 630,
      alt: 'To kvinner som koser seg utendørs på terrassen med varme komfortplagg fra Utekos.'
    }
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      'index': true,
      'follow': true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  verification: {
    other: {
      'facebook-domain-verification':
        'e3q80hk1igl2celczeysvf7y1mltrs',
      'p:domain_verify': 'edb3d2ffc77d9930280b515c685c5e13'
    }
  }
}
