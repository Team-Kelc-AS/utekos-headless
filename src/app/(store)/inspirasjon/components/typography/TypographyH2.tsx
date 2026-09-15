import { H2 } from '@/components/typography/TypographyH2'
import { P } from '@/components/typography/TypographyP'

export function TypographyH2() {
  return (
    <>
      <H2
        ID='hero-subheading'
        className='font-sans w-full pt-2 pb-0 text-xl! font-medium text-foreground md:text-3xl!'
      >
        Kompromissløs komfort og
        <br className='sm:hidden' />
        {' '}
        overlegen allsidighet.
      </H2>
      <P className='pt-2 text-center text-xl! font-sans text-foreground font-medium md:text-3xl! not-first:mt-0'>
        Juster, form og nyt.
      </P>
    </>
  )
}
