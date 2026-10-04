import Image from 'next/image'
import Link from 'next/link'
import styles from './HelpChooseCard.module.css'

export function SvaleGuideCard() {
  return (
    <div
      className={`relative flex aspect-2/3 h-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-card shadow-2xl ${styles.brandFontVariant}`}
    >
      <Image
        src='/Svale_Hoodie_1000x1500.webp'
        alt='Hetten på Utekos Svale.'
        fill
        quality={95}
        sizes='(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 67vw'
        loading='lazy'
        className='object-contain'
      />
      <div className='pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent' />
      <div className='relative mt-auto p-3 md:p-4'>
        <h3 className='mb-3 font-google-sans text-base leading-tight font-extrabold text-white md:text-xl'>
          Utekos Svale
        </h3>
        <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
          <Link
            href='/handlehjelp/storrelsesguide'
            className='flex h-11 items-center justify-center rounded-full bg-primary px-2 font-google-sans text-xs font-medium text-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
          >
            Størrelsesguide
          </Link>
          <Link
            href='/produkter/utekos-svale'
            className='flex h-11 items-center justify-center rounded-full bg-white px-2 font-google-sans text-xs font-medium text-black hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
          >
            Se Utekos Svale
          </Link>
        </div>
      </div>
    </div>
  )
}
