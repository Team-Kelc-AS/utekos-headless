import Image from 'next/image'
import Link from 'next/link'
import { MerchantTruckIcon, ReturnsOutlineIcon } from '@/components/utekos-icons'

export function TrustSignals() {
  return (
    <div
      className='mt-6 mb-2 overflow-hidden rounded-2xl bg-jungle md:mt-8 md:mb-0 md:rounded-lg'
      role='complementary'
      aria-label='Trygghetsinformasjon'
    >
      <Link
        href='/frakt-og-retur'
        className='block text-foreground no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'
        aria-label='Les mer om frakt, retur og betaling'
      >
        <div className='grid grid-cols-3 gap-x-3 gap-y-2.5 px-3 pt-4 pb-5 text-center sm:px-4 sm:pb-6'>
          <div className='grid min-w-0 justify-items-center gap-2'>
            <span className='flex h-[30px] w-[84px] items-center justify-center'>
              <Image
                src='/postnord_blue_wordmark.svg'
                alt=''
                width={1064}
                height={200}
                unoptimized
                className='h-auto w-full'
              />
            </span>
            <p className='m-0 font-sans text-[13px] font-extrabold leading-snug text-foreground'>
              Gratis frakt
            </p>
          </div>

          <div className='grid min-w-0 justify-items-center gap-2'>
            <span
              className='flex size-[30px] items-center justify-center text-foreground'
              aria-hidden='true'
            >
              <ReturnsOutlineIcon tone="orange" className='size-[30px]' strokeWidth={1.75} />
            </span>
            <p className='m-0 font-sans text-[13px] font-extrabold leading-snug text-foreground'>
              Gratis bytte
            </p>
          </div>

          <div className='grid min-w-0 justify-items-center gap-2'>
            <span
              className='flex size-[30px] items-center justify-center text-foreground'
              aria-hidden='true'
            >
              <MerchantTruckIcon tone="orange" className='size-[30px]' strokeWidth={1.75} />
            </span>
            <p className='m-0 font-sans text-[13px] font-extrabold leading-snug text-foreground'>
              Sendes samme dag
            </p>
          </div>
        </div>

        <div
          className='bg-jungle-tone/45 px-3.5 py-4'
          aria-label='Betalingsmetoder'
        >
          <div className='mx-auto grid w-full max-w-[398px] grid-cols-[69fr_63fr_92fr_60fr_50fr] items-center gap-x-4'>
            <Image
              src='/klarna_orig.svg'
              alt='Klarna'
              width={69}
              height={30}
              unoptimized
              className='h-auto w-full'
            />
            <Image
              src='/visa_orig.svg'
              alt='Visa'
              width={63}
              height={21}
              unoptimized
              className='h-auto w-full'
            />
            <Image
              src='/vipps_orig.svg'
              alt='Vipps'
              width={92}
              height={24}
              unoptimized
              className='h-auto w-full'
            />
            <Image
              src='/gpay_orig.svg'
              alt='Google Pay'
              width={60}
              height={32}
              unoptimized
              className='h-auto w-full'
            />
            <Image
              src='/apple_orig.svg'
              alt='Apple Pay'
              width={50}
              height={32}
              unoptimized
              className='h-auto w-full'
            />
          </div>
        </div>
      </Link>
    </div>
  )
}
