import OrangeLogoHorizontal from '@public/OrangeLogoHorizontal.svg'
import Image from 'next/image'

export function ProductsPageHeader() {
  return (
    <header className='relative left-[calc(-50vw+50%)] mb-12 w-screen overflow-hidden bg-jungle pt-12 pb-16 text-foreground'>
      <div className='container mx-auto px-4 text-center'>
        <Image
          src={OrangeLogoHorizontal}
          alt='Utekos'
          sizes='(max-width: 639px) 9rem, 11rem'
          className='mx-auto mb-8 h-auto w-36 sm:w-44'
        />

        <h1 className='mx-auto max-w-5xl font-sans text-3xl font-bold text-foreground sm:text-5xl md:text-7xl'>
          <span className='block'>Kolleksjonen for</span>
          <span className='block pt-0.5 leading-tight'>
            kompromissløs komfort
          </span>
        </h1>

        <p className='mx-auto mt-4 max-w-3xl text-lg leading-normal text-foreground/95 md:text-xl'>
          Vi har redefinert utekosen gjennom teknologi og
          funksjonalitet. <br className='hidden md:block' />
          Utforsk vår kolleksjon og skreddersy din egen varme.
        </p>
      </div>
    </header>
  )
}
