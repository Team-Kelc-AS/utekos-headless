import Image from 'next/image'

export function ShippingReturnsMobileHero() {
  return (
    <div className='relative mb-8 w-full overflow-hidden md:hidden'>
      <Image
        src='/Frakt-Retur-1.webp'
        alt='Utekos-eske med fleecejakke klar til sending'
        width={1090}
        height={827}
        priority
        quality={95}
        sizes='100vw'
        className='h-auto w-full object-cover'
      />
      <h1 className='absolute inset-0 z-10 flex items-start justify-start pt-12 pl-10 pr-6 sm:pl-12'>
        <span className='text-left font-sans text-5xl leading-[0.88] font-extrabold tracking-tight text-foreground'>
          Frakt
          <br />
          og retur
        </span>
      </h1>
    </div>
  )
}
