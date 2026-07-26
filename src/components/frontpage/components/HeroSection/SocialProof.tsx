import Image from 'next/image'
import WordmarkWhite from '@public/WordmarkWhite.svg'
import KlarnaWordmark from '@public/KlarnaW.png'
import { cn } from '@/lib/utils/className'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import { H2 } from '@/components/typography/TypographyH2'
import { P } from '@/components/typography/TypographyP'

/**
 * Klarna pink-pill geometry from KlarnaLogo.png — slightly softer than full capsule:
 * aspect ≈ 1447/609, corner radius ≈ 27% of height
 * → CSS elliptical radii 11.4% / 27%.
 */
const logoTileClasses =
  'relative mx-auto flex aspect-[1447/609] w-[78%] shrink-0 items-center justify-center overflow-hidden rounded-[11.4%_/_27%] px-4 py-2.5 sm:px-5 sm:py-3'

const logoMarkClasses =
  'h-auto w-[82%] max-w-none object-contain'

export function SocialProof() {
  const cardClasses =
    'relative overflow-hidden rounded-[1.5rem] bg-muted text-card-foreground backdrop-blur-2xl transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-2xl'

  return (
    <div className='container mx-auto max-w-7xl rounded-lg bg-muted px-4 py-8 sm:py-12 lg:py-16'>
      <div className='grid grid-cols-1 gap-8 bg-muted lg:grid-cols-3 lg:items-center'>
        <AnimatedBlock
          className='will-animate-fade-in-up lg:col-span-2'
          delay='0.2s'
          threshold={0.3}
        >
          <div
            className={cn(
              cardClasses,
              'group flex h-full flex-col justify-center bg-muted px-8 py-5 sm:px-12 sm:py-8 lg:px-16 lg:py-10'
            )}
          >
            <div
              className='via-coral-green pointer-events-none absolute inset-0 z-0 -translate-x-full bg-linear-to-r from-transparent to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full'
              aria-hidden='true'
            />

            <div className='relative z-10 text-left'>
              <H2
                ID='social-proof-heading'
                className='font-google-sans font-sans text-5xl font-bold text-card-foreground md:text-6xl lg:text-7xl'
              >
                <span className='block'>Juster,</span>
                <span className='block'>form</span>
                <span className='block'>og nyt.</span>
              </H2>

              <P className='w-full text-left text-lg text-card-foreground not-first:mt-0 md:max-w-xl'>
                Oppdag en smartere måte å holde deg komfortabel
                utendørs på, slik at du kan forlenge
                favorittstundene dine.
              </P>
            </div>
          </div>
        </AnimatedBlock>

        <AnimatedBlock
          className='will-animate-fade-in-up flex flex-col justify-center gap-8'
          delay='0.4s'
          threshold={0.3}
        >
          <div
            className={logoTileClasses}
            style={{ backgroundColor: '#bb4d0f' }}
          >
            <Image
              src={WordmarkWhite}
              alt='Utekos'
              width={1280}
              height={311}
              className={logoMarkClasses}
            />
          </div>

          <div
            className={logoTileClasses}
            style={{ backgroundColor: '#FFA8CD' }}
          >
            <Image
              src={KlarnaWordmark}
              alt='Klarna'
              width={739}
              height={188}
              className={cn(logoMarkClasses, 'brightness-0')}
            />
          </div>
        </AnimatedBlock>
      </div>
    </div>
  )
}
