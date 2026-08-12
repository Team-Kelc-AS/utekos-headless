export function ShippingReturnsSection() {
  return (
    <section
      aria-labelledby='shipping-returns-heading'
      className='w-full bg-jungle px-6 py-16 text-foreground md:bg-card md:px-12 md:py-24'
    >
      <div className='mx-auto max-w-5xl'>
        <h2
          id='shipping-returns-heading'
          className='font-google-sans text-4xl leading-[0.95] font-bold tracking-tight md:text-6xl'
        >
          Frakt og retur
        </h2>
        <div className='mt-7 grid gap-5 md:grid-cols-2'>
          <div className='rounded-2xl border border-border bg-night p-6 md:bg-background'>
            <h3 className='font-google-sans text-2xl font-bold'>
              Frakt i Norge
            </h3>
            <p className='leading-text-paragraph mt-3 text-foreground/82'>
              Frakt koster 99 kr for ordre til og med 998,99 kr.
              Ordre fra 999 kr får fri frakt. Normal transporttid
              er 2–5 virkedager.
            </p>
          </div>
          <div className='rounded-2xl border border-border bg-night p-6 md:bg-background'>
            <h3 className='font-google-sans text-2xl font-bold'>
              Angrerett og reklamasjon
            </h3>
            <p className='leading-text-paragraph mt-3 text-foreground/82'>
              Du har 14 kalenderdagers angrerett fra fysisk
              mottak og ordner ordinær returfrakt selv. Ved en
              gyldig reklamasjon dekker Utekos nødvendig
              returfrakt.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
