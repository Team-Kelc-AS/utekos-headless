// Path: src/app/inspirasjon/terrassen/sections/SocialProof.tsx

import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { H2 } from '@/components/typography/TypographyH2'
import { P } from '@/components/typography/TypographyP'
import { MotionReveal } from './TerraceMotion'
import kristin2 from '@/assets/images/about/kristin.webp'


export function SocialProof() {
  return (
    <article className='bg-[var(--terrace-night-soft)] py-24 text-[var(--terrace-cream)] md:py-32'>
      <div className='container mx-auto px-4'>
        <MotionReveal className='max-w-3xl'>
          <H2
            ID='terrasse-kundeopplevelse'
            Text='Huseiere elsker Utekos'
            className='mb-8 pb-0 text-left text-[clamp(3rem,6vw,5.75rem)] leading-[0.95] text-[var(--terrace-cream)]'
          />

          <Card className='rounded-lg border-none bg-jungle text-[var(--terrace-cream)] shadow-[0_28px_80px_-54px_rgb(0_0_0/0.86)] ring-0'>
            <CardContent className='p-8 sm:p-12'>
              <blockquote className='mb-8'>
                <P className='text-center font-utekos-text-medium text-xl leading-relaxed text-[var(--terrace-cream)] not-first:mt-0 md:text-2xl'>
                  &quot;Vi har doblet bruken av terrassen etter at
                  vi fikk Utekos i hus. Den brukes av hele
                  familien, fra tenåringen som vil sitte ute med
                  venner, til oss voksne som endelig kan nyte
                  kveldene ute uten å pakke oss inn i ti
                  tepper.&quot;
                </P>
              </blockquote>
              <div className='flex items-center justify-center gap-4'>
                <Image
                  src={kristin2}
                  alt='Kristin'
                  width={48}
                  height={48}
                  sizes='48px'
                  className='size-12 rounded-full object-cover'
                />
                <div className='text-left'>
                  <P className='font-utekos-text-medium leading-tight tracking-normal text-[var(--terrace-cream)] not-first:mt-0'>
                    Kristin
                  </P>
                  <P className='text-sm leading-relaxed tracking-normal text-[var(--terrace-sage-soft)] not-first:mt-1'>
                    Eneboligeier fra Ulvik
                  </P>
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionReveal>
      </div>
    </article>
  )
}
