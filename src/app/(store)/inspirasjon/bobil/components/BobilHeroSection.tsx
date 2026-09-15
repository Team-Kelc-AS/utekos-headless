import { H1 } from '@/components/typography/TypographyH1'
import { Ingress } from '@/components/typography/Ingress'

export function BobilHeroSection() {
  return (
    <hgroup className='w-full px-8 py-12 md:px-16 md:py-24 lg:px-24 lg:py-32'>
      <H1
        Text='Forleng bobilsesongen med Utekos'
        ID='bobil-hero-h1'
        className='mb-6'
      />
      <Ingress Text='Fra kjølige morgener til sosiale kvelder - oppdag hvordan Utekos blir din beste følgesvenn på bobilturen.' />
    </hgroup>
  )
}
