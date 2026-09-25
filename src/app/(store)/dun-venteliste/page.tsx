import type { Metadata } from 'next'
import { DunWaitlistForm } from './components/DunWaitlistForm'

export const metadata: Metadata = {
  title: 'Få beskjed når Utekos Dun er tilbake | Utekos',
  description:
    'Meld deg på ventelisten for Utekos Dun. Vi gir deg beskjed på e-post og mobil når jakken er tilbake.',
  alternates: { canonical: '/dun-venteliste' },
  openGraph: {
    title: 'Få beskjed når Utekos Dun er tilbake',
    description:
      'Meld deg på ventelisten. Vi sier fra når Utekos Dun er tilgjengelig igjen.',
    url: '/dun-venteliste',
    siteName: 'Utekos',
    locale: 'no_NO',
    type: 'website'
  }
}

export default function DunWaitlistPage() {
  return (
    <article className='mx-auto w-full max-w-md px-4 py-16 sm:py-24'>
      <h1 className='font-sans text-3xl font-semibold tracking-[-0.02em] text-balance text-foreground sm:text-4xl'>
        Få beskjed når Utekos Dun er tilbake
      </h1>
      <DunWaitlistForm />
    </article>
  )
}
