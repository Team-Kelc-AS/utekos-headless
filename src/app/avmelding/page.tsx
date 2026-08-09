import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meld deg av e-post | Utekos',
  robots: { index: false, follow: false }
}

type UnsubscribePageProps = {
  searchParams: Promise<{
    token?: string
    status?: string
  }>
}

export default async function UnsubscribePage({
  searchParams
}: UnsubscribePageProps) {
  const { token, status } = await searchParams

  return (
    <main className='mx-auto flex min-h-[70vh] max-w-2xl items-center px-6 py-16'>
      <section
        aria-labelledby='unsubscribe-heading'
        className='w-full rounded-xl border border-gray-300 bg-white p-8 text-gray-950 shadow-sm'
      >
        <h1 id='unsubscribe-heading' className='text-3xl font-semibold'>
          Meld deg av e-post
        </h1>

        {status === 'success' ? (
          <p className='mt-5 text-lg leading-8'>
            Du er nå meldt av. Vi sender ikke flere e-poster om den
            forlatte kassen.
          </p>
        ) : status === 'error' ? (
          <p role='alert' className='mt-5 text-lg leading-8'>
            Avmeldingen kunne ikke fullføres. Prøv igjen eller kontakt
            kundeservice@utekos.no.
          </p>
        ) : token ? (
          <>
            <p className='mt-5 text-lg leading-8'>
              Bekreft at du vil stoppe gjenværende påminnelser og sette
              e-postsamtykket ditt i Shopify til avmeldt.
            </p>
            <form action='/api/email/unsubscribe' method='post' className='mt-8'>
              <input type='hidden' name='token' value={token} />
              <input type='hidden' name='redirect' value='1' />
              <button
                type='submit'
                className='min-h-11 rounded-md bg-gray-950 px-6 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4'
              >
                Bekreft avmelding
              </button>
            </form>
          </>
        ) : (
          <p role='alert' className='mt-5 text-lg leading-8'>
            Avmeldingslenken er ugyldig.
          </p>
        )}
      </section>
    </main>
  )
}
