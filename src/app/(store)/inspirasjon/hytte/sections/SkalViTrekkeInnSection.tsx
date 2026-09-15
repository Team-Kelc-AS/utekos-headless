import { H2 } from '@/components/typography/TypographyH2'
import { Lead } from '@/components/typography/Lead'
import { SectionBox } from '@/components/layout/SectionBox'

export function SkalViTrekkeInnSection() {
  return (
    <SectionBox>
      <article
        id='skal-vi-trekke-inn'
        className='w-full overflow-x-clip bg-background px-4 pt-8 pb-8 text-foreground sm:px-6 md:px-8 md:pt-12 lg:px-10 lg:pt-16'
      >
        <div className='max-w-7xl text-left'>
          <H2
            Text='Skal vi trekke inn?'
            ID='skal-vi-trekke-inn-h2'
            className='bg-transparent text-foreground'
          />
          <Lead
            Text='Med Utekos blir svaret enkelt.'
            className='bg-transparent text-foreground md:pt-2'
          />
          <Lead
            Text='Skreddersy varmen for å fortsette følelsen av frihet og velvære.'
            className='bg-transparent text-foreground md:-mt-2'
          />
        </div>
      </article>
    </SectionBox>
  )
}
