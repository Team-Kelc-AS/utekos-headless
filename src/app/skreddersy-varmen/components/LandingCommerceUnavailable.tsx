export function LandingCommerceUnavailable() {
  return (
    <section className='w-full bg-foreground-muted px-6 py-16 text-background'>
      <div className='mx-auto max-w-3xl rounded-sm border border-background/12 bg-foreground p-6 text-center shadow-sm'>
        <h2 className='font-google-sans text-2xl font-bold'>
          Kjøpsvalget er midlertidig utilgjengelig
        </h2>
        <p className='leading-text-paragraph mt-3 text-background/78'>
          Vi kunne ikke bekrefte pris eller lagerstatus fra
          Shopify. Produktinformasjonen er tilgjengelig, men
          Utekos viser ingen konstruerte commerce-opplysninger
          eller kjøpsknapp.
        </p>
      </div>
    </section>
  )
}
