// Path: src/app/personvern/page.tsx
import { GridCross } from '@/components/legal/GridCross'
import { PrivacyNav } from '@/components/legal/PrivacyNav'
import {
  lastUpdated,
  privacySections
} from '@/db/config/privacy.config'
import type { Metadata } from 'next'
import { FacebookLoginConnectionControl } from '@/components/facebook-login/FacebookLoginConnectionControl'

export const metadata: Metadata = {
  metadataBase: new URL('https://utekos.no'),
  title: 'Personvernerklæring | Utekos',
  description:
    'Se hvilke personopplysninger KELC AS behandler for Utekos, hvorfor de brukes, hvem de deles med, lagringstidene og rettighetene dine.',
  keywords: [
    'Personvern',
    'GDPR',
    'Personopplysninger',
    'Sikkerhet',
    'Utekos vilkår'
  ],
  alternates: { canonical: '/personvern' },
  openGraph: {
    title: 'Personvernerklæring | Utekos',
    description:
      'Formål, behandlingsgrunnlag, leverandører, cookies, lagringstider og rettigheter hos Utekos.',
    url: '/personvern',
    siteName: 'Utekos',
    images: [
      {
        url: '/og-image-personvern.jpg',
        width: 1200,
        height: 630,
        alt: 'Utekos personvern'
      }
    ],
    locale: 'no_NO',
    type: 'website'
  }
}

const SectionWrapper = ({
  id,
  title,
  children
}: {
  id: string
  title: string
  children: React.ReactNode
}) => (
  <article id={id} className='relative scroll-mt-24 py-12'>
    <GridCross className='top-15 -left-4 hidden lg:block' />
    <GridCross className='top-15 -right-4 hidden lg:block' />
    <div className='absolute inset-x-0 top-18.75 hidden h-px border-t border-dashed border-white/10 lg:block' />
    <h2 className='font-utekos-text-medium text-2xl sm:text-3xl'>
      {title}
    </h2>
    <div className='prose prose-invert mt-6 max-w-none text-white/80'>
      {children}
    </div>
  </article>
)

export default function PrivacyPolicyPage() {
  return (
    <div className='bg-docs py-24 text-white'>
      <article className='container mx-auto max-w-6xl px-4'>
        <div className='relative border border-white/10'>
          <GridCross className='top-0 left-0 -translate-x-1/2 -translate-y-1/2' />
          <GridCross className='right-0 bottom-0 translate-x-1/2 translate-y-1/2' />

          <div className='p-8 sm:p-12 lg:p-16'>
            <header className='text-center'>
              <h1 className='mx-auto text-center font-google-sans text-4xl font-bold text-white sm:text-5xl'>
                Personvern
              </h1>
              <p className='mt-4 text-white/70'>
                Sist oppdatert: {lastUpdated}
              </p>
            </header>

            <div className='mt-12 lg:grid lg:grid-cols-12 lg:gap-16'>
              <div className='lg:col-span-8'>
                {privacySections.map(
                  ({ id, title, content }) => (
                    <SectionWrapper
                      key={id}
                      id={id}
                      title={title}
                    >
                      {content}
                    </SectionWrapper>
                  )
                )}
                <FacebookLoginConnectionControl />
              </div>

              <aside className='lg:col-span-4'>
                <div className='lg:sticky lg:top-28'>
                  <PrivacyNav
                    sections={privacySections.map(
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
