import Image from 'next/image'
import { MapPin } from 'lucide-react'
import { AboutBadge } from './AboutBadge'

const pastEvents = [
  {
    name: 'Boligmesse Sotra',
    location: 'Sotra',
    date: '21.-23. mars 2025'
  },
  {
    name: 'Smien, Laksevåg',
    location: 'Bergen',
    date: '3.-4. desember 2022'
  },
  {
    name: 'Båt- og caravan messe',
    location: 'Ålesund',
    date: '3.-5. mars 2023'
  }
]

const fairImages = [
  '/messe-1.webp',
  '/messe-2.webp',
  '/erling-messe.JPEG',
  '/messe-3.webp'
] as const

export function AboutEvents() {
  return (
    <article className='bg-background py-20 text-foreground sm:py-28'>
      <div className='mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8'>
        <div>
          <AboutBadge className='mb-6'>Møteplasser</AboutBadge>
          <h2 className='font-utekos-text-medium text-4xl leading-tight text-foreground sm:text-5xl'>
            Der du har møtt oss
          </h2>
          <p className='/80 mt-5 text-lg leading-8 text-foreground/80'>
            Vi elsker å prate med folk. Derfor er vi jevnlig på
            messer og stands, og her har vi fått verdifulle
            innspill fra kunder som faktisk har kjent komforten.
          </p>

          <div className='mt-9 space-y-5'>
            {pastEvents.map(event => (
              <article
                key={`${event.name}-${event.date}`}
                className='flex gap-4'
              >
                <div className='flex size-11 shrink-0 items-center justify-center rounded-md bg-muted text-ceramic'>
                  <MapPin
                    aria-hidden='true'
                    className='size-5'
                  />
                </div>
                <div>
                  <h3 className='font-utekos-text-medium text-lg text-foreground'>
                    {event.name}
                  </h3>
                  <p className='/72 text-sm leading-6 text-foreground/72'>
                    {event.location} · {event.date}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          {fairImages.map((src, index) => (
            <div
              key={src}
              className='relative aspect-4/3 overflow-hidden rounded-lg border border-border bg-card'
            >
              <Image
                src={src}
                alt={`Bilde fra Utekos-stand eller messe ${index + 1}`}
                fill
                sizes='(max-width: 1024px) 50vw, 25vw'
                className='object-cover'
              />
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}
