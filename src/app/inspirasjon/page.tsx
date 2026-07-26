import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'
import Link from 'next/link'

export const metadata = {
  metadataBase: new URL('https://utekos.no'),
  title:
    'Inspirasjon til hytteliv, bobil, båtliv og utekos | Utekos',
  description:
    'Finn inspirasjon til mer komfort ute: hytteliv, bobil, båtliv, terrasse, grillkvelder og isbading med Utekos.',
  alternates: { canonical: '/inspirasjon' },
  openGraph: {
    title: 'Inspirasjon til mer utekos | Utekos',
    description:
      'Utforsk guider og ideer for hytteliv, bobil, båtliv, terrasse, grillkvelder og isbading.',
    url: '/inspirasjon',
    siteName: 'Utekos',
    locale: 'no_NO',
    type: 'website'
  }
}

export default function InspirationPage() {
  return (
    <article className='dark:bg-dark-background bg-background py-16 text-foreground sm:py-24'>
      <div className='container mx-auto max-w-4xl px-4'>
        <UtekosBreadcrumbBar
          embedded
          surface='transparent'
          className='mb-8'
          items={[
            { label: 'Forsiden', href: '/' },
            { label: 'Inspirasjon' }
          ]}
        />
      </div>
      <div className='container mx-auto max-w-4xl px-4 text-center'>
        <h1 className='font-google-sans text-4xl leading-[0.95] font-bold tracking-normal sm:text-5xl lg:text-6xl'>
          Inspirasjon for mer utekos
        </h1>
        <p className='leading-text-paragraph /90 mx-auto mt-6 max-w-2xl text-lg tracking-normal text-foreground/90'>
          Utforsk praktiske guider for hytteliv, bobil, båtliv,
          terrasse, grillkvelder og isbading. Finn situasjonen
          som ligner din, og se hvordan Utekos forlenger de gode
          øyeblikkene ute.
        </p>
        <div className='mt-8 flex flex-wrap justify-center gap-4'>
          <BrandBadge
            asChild
            tone='commerce-primary'
            className='dark:border-dark-primary/24 border border-primary/24 px-7 py-3 font-utekos-text-medium text-base leading-4 tracking-normal shadow-[0_18px_38px_-30px_rgba(49,42,18,0.58)] transition-transform duration-300 hover:-translate-y-0.5 hover:brightness-105'
          >
            <Link href='/produkter'>Se produktene</Link>
          </BrandBadge>
          <BrandBadge
            asChild
            tone='commerce-secondary'
            className='dark:border-dark-background/18 border border-background/18 px-7 py-3 font-utekos-text-medium text-base leading-4 tracking-normal shadow-[0_18px_38px_-32px_rgba(14,18,35,0.7)] transition-transform duration-300 hover:-translate-y-0.5 hover:brightness-110'
          >
            <Link href='/handlehjelp/storrelsesguide'>
              Finn riktig størrelse
            </Link>
          </BrandBadge>
        </div>
      </div>
    </article>
  )
}
