import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import UtekosWordmark from '@/components/BrandComponents/utils/UtekosWordmark'
import { grillSectionSurfaces } from '../theme/sectionSurfaces'

const { light } = grillSectionSurfaces

export function GrillMasterSection() {
  return (
    <article className={light.section}>
      <div className='container mx-auto px-4'>
        <div className='mx-auto max-w-3xl text-center'>
          <h2 className={`mb-8 font-sans text-4xl font-extrabold md:text-5xl ${light.heading}`}>
            <span className='inline-flex flex-wrap items-baseline justify-center gap-x-[0.22em] gap-y-2'>
              <span>Grillmestere elsker</span>
              <UtekosWordmark
                className='inline-block h-[0.78em] w-auto shrink-0 translate-y-[0.06em]'
                style={{ color: 'var(--foreground)' }}
              />
            </span>
          </h2>

          <Card className='border-foreground/18 bg-background shadow-[0_28px_80px_-54px_color-mix(in_oklch,var(--background)_82%,transparent)]'>
            <CardContent className='p-8 sm:p-12'>
              <blockquote className='leading-text-paragraph mb-6 text-xl tracking-[-0.02em] text-foreground'>
                &quot;Jeg elsker å arrangere grillfester, men
                hatet at folk dro inn så snart det ble kjølig.
                Utekos endret alt. Festen fortsetter ute — rundt
                grillen, der den hører hjemme.&quot;
              </blockquote>
              <div className='flex items-center justify-center gap-4'>
                <Image
                  src='/hans-age.webp'
                  alt='Hans Åge'
                  width={48}
                  height={48}
                  sizes='48px'
                  className='size-12 rounded-full object-cover'
                />
                <div className='text-left'>
                  <p className='font-utekos-text-medium leading-tight tracking-[-0.01em] text-foreground'>
                    Hans Åge
                  </p>
                  <p className='leading-text-paragraph text-sm tracking-[-0.02em] text-ancient-water'>
                    Hobby-grillmester og livsnyter
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </article>
  )
}
