import type { Metadata } from 'next'
import type { Route } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Siden ble ikke funnet – Utekos',
  description:
    'Siden du leter etter finnes ikke. Finn veien videre til produkter, hjelpesider eller kontakt.',
  robots: { index: false, follow: true }
}

const helpfulLinks = [
  { href: '/', label: 'Forsiden' },
  { href: '/produkter', label: 'Alle produkter' },
  { href: '/skreddersy-varmen', label: 'Skreddersy varmen' },
  { href: '/sitemap.xml', label: 'Nettstedskart' },
  { href: '/llms.txt', label: 'AI-indeks (llms.txt)' },
  { href: '/kontaktskjema', label: 'Kontakt oss' }
] as const

export default function NotFound() {
  return (
    <main className='mx-auto flex w-full max-w-2xl flex-col items-center text-left px-5 py-16 sm:py-24'>
      <h1 className='mt-2 text-3xl font-semibold text-left! sm:text-4xl'>
        Beklager
      </h1>
      <p className='mt-4 max-w-prose text-base text-pretty text-left text-muted-foreground'>
        Nettadressen du forsøkte å åpne finnes ikke hos Utekos.
        Fortsett der du slapp via en av lenkene under.</p>
      <nav aria-label='Nyttige lenker' className='mt-8 w-full'>
        <ul className='grid gap-3 sm:grid-cols-2'>
          {helpfulLinks.map(link => (
            <li key={link.href}>
              <Link
                href={link.href as Route}
                className='block rounded-xl border border-border px-4 py-3 text-sm font-medium underline-offset-4 hover:underline'
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  )
}
