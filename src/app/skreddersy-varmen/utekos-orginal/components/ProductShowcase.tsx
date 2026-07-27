import Image from 'next/image'
import {
  Check,
  ShieldCheck,
  Feather,
  CloudRain,
  type LucideIcon
} from 'lucide-react'
import ProductMain from '@public/UtekosMikrofiberVert.webp'

export function ProductShowcase() {
  return (
    <article
      id='section-solution'
      className='w-full bg-background py-24 text-[#F4F1EA]'
    >
      <div className='mx-auto max-w-7xl px-6 md:px-12'>
        <div className='grid grid-cols-1 items-center gap-16 lg:grid-cols-2'>
          <div className='space-y-8'>
            <div className='space-y-4'>
              <h2 className='font-serif text-4xl leading-tight text-primary dark:text-dark-primary md:text-5xl'>
                Utekos®
                <span className='font-utekos-text-medium mt-2 block text-2xl text-[#F4F1EA] md:text-3xl'>
                  Lettvekt møter kompromissløs varme.
                </span>
              </h2>
              <p className='font-utekos-text max-w-xl text-lg leading-relaxed font-light text-[#F4F1EA]/80'>
                Designet for nordiske forhold. Med smart hulfiber
                får du følelsen av dun, men med egenskapene som
                kreves når været skifter. Robust nok for
                leirplassen, myk nok for hytteveggen.
              </p>
            </div>
            <div className='grid grid-cols-1 gap-6 pt-4 md:grid-cols-2'>
              <FeatureItem
                icon={Feather}
                title='Lettvekt (ca. 800g)'
                desc='Overraskende lett, enkel å pakke med seg.'
              />
              <FeatureItem
                icon={CloudRain}
                title='Håndterer fukt'
                desc='Varmer selv om den blir våt. Tørker raskt.'
              />
              <FeatureItem
                icon={ShieldCheck}
                title='Allergivennlig'
                desc='Syntetisk hulfiber. Ingen animalske produkter.'
              />
              <FeatureItem
                icon={Check}
                title='DuraLite™ Nylon'
                desc='Vindtett og slitesterkt 20D/380T materiale.'
              />
            </div>
          </div>
          <div className='relative aspect-4/5 overflow-hidden rounded-2xl border border-[#F4F1EA]/5 bg-[#2C2420]/30 shadow-2xl'>
            <Image
              src={ProductMain}
              alt='Utekos Mikrofiber i bruk'
              fill
              className='object-cover'
              sizes='(max-width: 768px) 100vw, 50vw'
            />
          </div>
        </div>
      </div>
    </article>
  )
}

function FeatureItem({
  icon: Icon,
  title,
  desc
}: {
  icon: LucideIcon
  title: string
  desc: string
}) {
  return (
    <div className='flex items-start gap-4'>
      <div className='mt-1 rounded-full bg-primary/10 p-2 text-primary dark:bg-dark-primary/10 dark:text-dark-primary'>
        <Icon size={20} />
      </div>
      <div>
        <h3 className='font-utekos-text-medium text-lg text-[#F4F1EA]'>
          {title}
        </h3>
        <p className='font-utekos-text text-sm leading-snug text-[#F4F1EA]/60'>
          {desc}
        </p>
      </div>
    </div>
  )
}
