import Image from 'next/image'
import founderImage from '@/assets/images/about/eh_pointing_star_800.webp'
import { Quote } from 'lucide-react'
import { AboutBadge } from './AboutBadge'

const storyParagraphs = [
  'Jeg har alltid elsket de små, verdifulle øyeblikkene: den stille kaffekoppen på en kjølig morgen, den gode samtalen rundt bålpannen, eller roen i båten rett etter at solen har gått ned. Men frustrasjonen var alltid den samme: lag på lag med klær som gjorde meg mer til en Michelin-mann enn en avslappet livsnyter.',
  'Jeg lette etter ett enkelt, kompromissløst plagg. Et verktøy for komfort som var så behagelig at jeg glemte jeg hadde det på, men så funksjonelt at det lot meg eie øyeblikket. Svaret fantes ikke. Så jeg bestemte meg for å lage det selv.',
  'Det ble en reise som tok måneder med design, utallige prototyper, jakt på de rette materialene, og testing i pøsende bergensregn og på kalde fjelltopper. Resultatet ble Utekos. Ikke bare et produkt, men en hyllest til de små, verdifulle øyeblikkene i en travel hverdag.'
]

export function AboutFounder() {
  return (
    <article className='w-full bg-background px-6 py-20 text-foreground sm:px-8 sm:py-28 md:px-12 lg:px-16'>
      <div className='mx-auto grid max-w-7xl grid-cols-1 items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16'>
        {/* Kolonne 1: Tekstseksjon */}
        <div className='flex flex-col items-start'>
          <AboutBadge className='mb-6'>Vår historie</AboutBadge>

          <h2 className='font-google-sans font-sans text-4xl leading-tight font-bold text-foreground sm:text-5xl'>
            Fra idé til virkelighet
          </h2>

          <blockquote className='dark:border-dark-card/30 my-10 w-full rounded-2xl border border-card/30 bg-card p-6 shadow-sm sm:p-8'>
            <div className='flex items-start gap-5 sm:gap-6'>
              <div className='bg-accent-primary dark:text-dark-background mt-1 flex size-12 shrink-0 items-center justify-center rounded-xl text-background'>
                <Quote
                  aria-hidden='true'
                  className='size-6 fill-current'
                />
              </div>
              <p className='text-lg leading-relaxed font-medium text-foreground sm:text-xl sm:leading-8'>
                «Jeg var lei av stive pledd og gode øyeblikk som
                ble kuttet kort av kulden. Det måtte finnes en
                bedre måte å holde varmen på.»
              </p>
            </div>
          </blockquote>

          <div className='/90 space-y-6 font-utekos-text-medium text-lg leading-relaxed text-foreground/90'>
            {storyParagraphs.map(paragraph => (
              <p key={paragraph} className='max-w-prose'>
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Kolonne 2: Bildeseksjon */}
        <div className='flex w-full flex-col items-start lg:items-end'>
          <figure className='w-full max-w-md lg:max-w-none'>
            <div className='dark:border-dark-card/30 relative aspect-4/5 w-full overflow-hidden rounded-2xl border border-card/30 bg-card shadow-sm'>
              <Image
                src={founderImage}
                alt='Portrett av Erling Holthe, grunnlegger av Utekos'
                fill
                loading='lazy'
                sizes='(max-width: 1024px) 100vw, 45vw'
                className='object-cover'
              />
            </div>
            <figcaption className='mt-5 flex flex-col items-start'>
              <span className='font-google-sans font-sans text-lg font-bold text-foreground'>
                Erling Holthe
              </span>
              <span className='dark:text-dark-primary font-sans text-sm font-medium tracking-wider text-primary uppercase'>
                Grunnlegger
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </article>
  )
}
