// Path: src/app/vilkar-betingelser/page.tsx
import { GridCross } from '@/components/legal/GridCross'
import { PrivacyNav } from '@/components/legal/PrivacyNav'
import {
  lastUpdated,
  termsSections
} from '@/db/config/terms.config'
import type { Metadata } from 'next'
import { SectionWrapper } from './components/SectionWrapper'

export const metadata: Metadata = {
  metadataBase: new URL('https://utekos.no'),
  title: 'Vilkår og betingelser | Utekos',
  description:
    'Les våre vilkår og betingelser for bruk av Utekos-nettstedet og kjøp av produkter. Vi streber etter å gi deg en trygg og pålitelig handleopplevelse.',
  keywords: [
    'Salgsbetingelser',
    'Kjøpsvilkår',
    'Angrerett',
    'Reklamasjon',
    'Utekos vilkår'
  ],
  alternates: { canonical: '/vilkar-betingelser' },
  openGraph: {
    title: 'Vilkår og betingelser | Utekos',
    description:
      'Les våre vilkår og betingelser for bruk av Utekos-nettstedet og kjøp av produkter. Vi streber etter å gi deg en trygg og pålitelig handleopplevelse.',
    url: '/vilkar-betingelser',
    siteName: 'Utekos',
    images: [
      {
        url: '/og-image-terms.jpg',
        width: 1200,
        height: 630,
        alt: 'Utekos vilkår og betingelser'
      }
    ],
    locale: 'no_NO',
    type: 'website'
  }
}

export default function TermsPage() {
  return (
    <div className='bg-docs dark:bg-dark-docs py-24 text-white [--foreground:var(--foreground)] [--muted-foreground:var(--foreground)]'>
      <article className='container mx-auto max-w-6xl px-4'>
        <div className='relative border border-white/10'>
          <GridCross className='top-0 left-0 -translate-x-1/2 -translate-y-1/2' />
          <GridCross className='right-0 bottom-0 translate-x-1/2 translate-y-1/2' />

          <div className='p-8 sm:p-12 lg:p-16'>
            <header className='text-center'>
              <h1 className='font-google-sans mx-auto text-4xl font-bold sm:text-5xl'>
                Vilkår og betingelser
              </h1>
              <p className='mt-4 text-white/70'>
                Sist oppdatert: {lastUpdated}
              </p>
            </header>

            <div className='mt-12 lg:grid lg:grid-cols-12 lg:gap-16'>
              <div className='lg:col-span-8'>
                {termsSections.map(({ id, title, content }) => (
                  <SectionWrapper key={id} id={id} title={title}>
                    {content}
                  </SectionWrapper>
                ))}
              </div>

              <aside className='lg:col-span-4'>
                <div className='lg:sticky lg:top-28'>
                  <PrivacyNav
                    sections={termsSections.map(
                      ({ id, title }) => ({ id, title })
                    )}
                  />
                </div>
              </aside>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
