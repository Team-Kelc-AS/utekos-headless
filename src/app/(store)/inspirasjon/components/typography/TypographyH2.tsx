import { H1 } from '@/components/typography/TypographyH1'

export function TypographyH2() {
  return (
    <H1
      ID='hero-subheading'
      className='font-sans w-full mx-auto text-center self-center pb-0 text-xl! font-medium text-foreground md:text-3xl!'
    >
      Opplev kompromissløs komfort
      <br className='sm:hidden' />
      {' '} og overlegen allsidighet.
    </H1>
  )
}
