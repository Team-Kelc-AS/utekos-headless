import Image from 'next/image'
import Link from 'next/link'
import TRUSTBADGE from '@/assets/images/partners/TrustBadge.svg'

export function TrustSignals() {
  return (
    <div
      className='mt-6 overflow-hidden rounded-lg'
      role='complementary'
      aria-label='Trygghetsinformasjon'
    >
      <Link
        href='/frakt-og-retur'
        aria-label='Les mer om frakt, retur og betaling'
      >
        <Image
          src={TRUSTBADGE}
          alt='14 dagers åpent kjøp, rask levering med PostNord, enkelt og trygt. Betal med Vipps, Klarna, Visa, Google Pay og Apple Pay.'
          width={1200}
          height={812}
          sizes='(min-width: 1024px) 33vw, 100vw'
          className='h-auto w-full'
          quality={100}
        />
      </Link>
    </div>
  )
}
