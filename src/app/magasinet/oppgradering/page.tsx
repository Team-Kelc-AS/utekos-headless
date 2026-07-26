// src/app/magasinet/oppgradering/page.tsx

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Home,
  ShoppingBag
} from 'lucide-react'
import type { Route } from 'next'
import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'
export const metadata: Metadata = {
  title: 'Utekos Magasinet er under oppgradering | Utekos',
  description:
    'Utekos Magasinet er midlertidig under oppgradering. Finn veien videre til produkter, inspirasjon eller forsiden.',
  robots: { index: false, follow: true }
}

const links = [
  {
    href: '/produkter',
    label: 'Se produktene',
    description:
      'Utforsk Utekos-plagg, tilbehør og varme løsninger.',
    icon: ShoppingBag
  },
  {
    href: '/inspirasjon',
    label: 'Gå til inspirasjon',
    description:
      'Finn ideer for hytte, båt, bobil og gode øyeblikk ute.',
    icon: BookOpen
  },
  {
    href: '/',
    label: 'Til forsiden',
    description:
      'Start på nytt og finn veien videre fra forsiden.',
    icon: Home
  }
]

export default function MagazineUpgradePage() {
  return (
    <main className='dark:bg-dark-background min-h-screen bg-background text-foreground'>
      <UtekosBreadcrumbBar
        surface='transparent'
        items={[
          { label: 'Forsiden', href: '/' },
          { label: 'Magasinet', href: '/magasinet' },
          { label: 'Under oppgradering' }
        ]}
      />
      <article className='container mx-auto flex min-h-[72vh] items-center px-4 py-20 sm:py-28'>
        <div className='mx-auto max-w-5xl text-center'>
          <p className='dark:text-dark-secondary font-utekos-text-medium text-sm tracking-[0.18em] text-secondary'>
            Utekos Magasinet
          </p>

          <h1 className='font-google-sans mx-auto mt-5 max-w-4xl font-sans text-5xl leading-[0.92] font-bold text-balance sm:text-6xl lg:text-7xl'>
            Utekos Magasinet er under oppgradering
          </h1>

          <p className='mx-auto mt-6 max-w-3xl text-lg leading-[1.6] text-foreground sm:text-xl'>
            Vi oppdaterer magasinet vårt for å gi deg en enda
            bedre opplevelse, med mer relevante guider, artikler
            og inspirasjon. Mens vi gjør de siste justeringene,
            kan du gjerne utforske produktene våre, besøke
            inspirasjonssidene eller gå direkte til forsiden.
          </p>

          <div className='mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row'>
            <Link
              href='/produkter'
              className='dark:bg-dark-primary hover:bg-primary-hover dark:hover:bg-dark-primary-hover inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 font-utekos-text-medium text-base leading-[1.35] text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0'
            >
              Se produktene
              <ArrowRight className='size-4' aria-hidden />
            </Link>

            <Link
              href='/inspirasjon'
              className='dark:bg-dark-secondary dark:text-dark-secondary-foreground hover:bg-secondary-hover inline-flex min-h-12 items-center justify-center rounded-full bg-secondary px-7 py-3 font-utekos-text-medium text-base leading-[1.35] text-secondary-foreground transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0'
            >
              Gå til inspirasjon
            </Link>
          </div>

          <div className='mt-14 grid grid-cols-1 gap-4 text-left md:grid-cols-3'>
            {links.map(link => {
              const Icon = link.icon

              return (
                <Link
                  key={link.href}
                  href={link.href as Route}
                  className='group dark:border-dark-foreground rounded-lg border border-foreground bg-card p-5 text-card-foreground shadow-[0_22px_62px_-54px_color-mix(in_oklch,var(--foreground)_35%,transparent)] transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0'
                >
                  <div className='dark:bg-dark-primary mb-4 flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
                    <Icon className='size-5' aria-hidden />
                  </div>

                  <h2 className='font-google-sans font-sans text-2xl leading-[0.95] font-bold text-card-foreground'>
                    {link.label}
                  </h2>

                  <p className='mt-3 text-base leading-[1.55] text-card-foreground'>
                    {link.description}
                  </p>

                  <span className='dark:text-dark-secondary mt-5 inline-flex items-center gap-2 font-utekos-text-medium text-sm text-secondary'>
                    Gå videre
                    <ArrowRight
                      className='size-4 transition-transform group-hover:translate-x-1'
                      aria-hidden
                    />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </article>
    </main>
  )
}
