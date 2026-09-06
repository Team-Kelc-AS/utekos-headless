import Link from 'next/link'

type KjopFullfortPageProps = {
  searchParams: Promise<{ klarna_order_id?: string }>
}

export const metadata = {
  title: 'Takk for kjøpet | Utekos',
  robots: { index: false, follow: false }
}

export default async function KjopFullfortPage({
  searchParams
}: KjopFullfortPageProps) {
  const params = await searchParams
  const klarnaOrderId = params.klarna_order_id

  return (
    <main className='mx-auto flex min-h-[50vh] max-w-2xl flex-col justify-center px-4 py-16'>
      <h1 className='font-utekos-text-medium text-3xl tracking-tight text-foreground'>
        Takk for kjøpet
      </h1>
      <p className='mt-4 text-base text-foreground'>
        Betalingen din er registrert hos Klarna. Du mottar
        ordrebekreftelse på e-post så snart ordren er behandlet.
      </p>

      {klarnaOrderId ?
        <p className='mt-3 text-sm text-muted-foreground'>
          Klarna-referanse:{' '}
          <span className='font-mono text-foreground'>
            {klarnaOrderId}
          </span>
        </p>
      : null}

      <div className='mt-8 flex flex-wrap gap-3'>
        <Link
          href='/produkter'
          className='inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground'
        >
          Fortsett å handle
        </Link>
        <Link
          href='/'
          className='inline-flex min-h-11 items-center justify-center rounded-md border border-border px-5 py-2 text-sm font-medium text-foreground'
        >
          Til forsiden
        </Link>
      </div>
    </main>
  )
}
