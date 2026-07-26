// Path: src/app/frakt-og-retur/components/ShippingReturnsHeader.tsx
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'

export function ShippingReturnsHeader() {
  return (
    <>
      <header className='container mx-auto w-full items-start px-8 text-left'>
        <BrandBadge
          label='Fri frakt over 999 kr'
          backgroundColor='var(--card)'
          textColor='var(--foreground)'
          className='mb-6 border border-foreground/6 px-8 py-4 text-left text-sm md:text-base'
        />
        <h1 className='font-google-sans font-sans text-4xl font-bold text-foreground sm:text-4xl md:text-5xl lg:text-6xl'>
          Frakt og retur - enkelt og trygt
        </h1>
        <p className='mx-auto mt-4 text-left font-utekos-text text-lg text-foreground md:text-xl'>
          Vi ønsker at din handleopplevelse skal være like trygg
          og komfortabel som produktene våre.
        </p>
        <p className='mx-auto text-left font-utekos-text text-lg text-foreground md:text-xl'>
          Her finner du alt du trenger å vite om vår levering og
          returprosess.
        </p>
      </header>

      <div className='container mx-auto px-8 pt-4'>
        <p className='text-left font-utekos-text text-lg text-foreground md:text-xl'>
          Gjennom vår distribusjonspartner PostNord leveres
          bestillingen din innen 2–5 arbeidsdager etter at
          PostNord har hentet pakken fra varehuset.
        </p>
        <p className='text-left font-utekos-text text-lg text-foreground md:text-xl'>
          Sporing av tilsendelsen gjøres enkelt med
          sendingsnummeret du vil få tilsendt.
        </p>
        <p className='text-left font-utekos-text text-lg text-foreground md:text-xl'>
          Vi sender alle bestillinger som gjøres før kl. 16 samme
          dag. Hvor lang tid akkurat din bestilling tar, er
          avhengig av destinasjon, slik at du kan starte din
          utekos så raskt som mulig.
        </p>
      </div>
    </>
  )
}
