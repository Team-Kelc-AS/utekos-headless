import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image' // Importer Image-komponenten

import mormor3 from '@public/mormor3.webp'

export function SocialProofSection() {
  return (
    <article className='-foreground bg-sidebar-foreground py-24'>
      <div className='container mx-auto px-4'>
        <div className='mx-auto max-w-3xl text-center'>
          <Card className='dark:bg-dark-background border-neutral-800 bg-background'>
            <CardContent className='p-12'>
              <blockquote className='/90 mb-6 text-xl text-foreground/90 italic'>
                &quot;Fikk Utekos i 50-årsgave av barna. Helt
                ærlig den beste gaven jeg har fått på årevis. Den
                brukes hver eneste helg på hytten, uansett vær.
                Anbefales!&quot;
              </blockquote>
              <div className='flex items-center justify-center gap-4'>
                <div className='h-12 w-12 overflow-hidden rounded-full'>
                  {' '}
                  <Image
                    src={mormor3}
                    alt='Profilbilde av Bjørg H.'
                    width={48} // Sett en fast bredde
                    height={48} // Sett en fast høyde for å opprettholde aspektet
                    className='size-full object-cover' // Sørg for at bildet dekker området
                  />
                </div>
                <div className='text-left'>
                  <p className='font-utekos-text-medium'>
                    Bjørg H.
                  </p>
                  <p className='dark:text-dark-muted-foreground text-sm text-muted-foreground'>
                    Fornøyd gavemottaker
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
