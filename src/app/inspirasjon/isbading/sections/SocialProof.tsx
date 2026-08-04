// Path: src/app/inspirasjon/isbading/sections/SocialProof.tsx

import Image from 'next/image'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { CAROUSEL_SSR } from '@/components/ui/carousel-ssr'
import comfyAfterbath1080 from '@/assets/images/comfyrobe/comfy-afterbath-1080.png'
import comfyDesign1080 from '@/assets/images/comfyrobe/comfy-design-1080.png'
import comfyIsbading1080Master from '@/assets/images/comfyrobe/comfy-isbading-1080-master.png'
import comfyIsbadingTo1080 from '@/assets/images/comfyrobe/comfy-isbading-to-1080.png'
import comfyOpen1080 from '@/assets/images/comfyrobe/comfy-open-1080.png'


const galleryImages = [
  {
    src: comfyAfterbath1080, // Husk å legge inn riktige bildenavn
    alt: 'En isbader kommer opp av vannet med et stort smil, klar til å ta på seg Utekos-kåpen.',
    title: 'Det øyeblikkelige rushet',
    description:
      'Sekundet du kommer opp av vannet og kjenner varmen fra kåpen treffe huden. Det er da magien skjer.'
  },
  {
    src: comfyIsbadingTo1080,
    alt: 'En vennegjeng står i snøen iført Utekos-kåper og drikker kaffe etter badet.',
    title: 'Varmen i fellesskapet',
    description:
      'Isbading er ofte best sammen med andre. Del opplevelsen, kaffen og varmen uten å fryse.'
  },
  {
    src: comfyIsbading1080Master,
    alt: 'Person sitter på et svaberg med rimfrost, pakket inn i Utekos og ser utover havet.',
    title: 'Ro i sjelen',
    description:
      'Finn stillheten ved havet. Med riktig utstyr kan du sitte lenge og la pulsen synke etter sjokket.'
  },
  {
    src: comfyOpen1080,
    alt: 'Person på vei fra badstue til sjøen i en Utekos-poncho.',
    title: 'Fra sauna til sjø',
    description:
      'Den perfekte følgesvenn mellom den varme badstuen og den iskalde fjorden.'
  },
  {
    src: comfyDesign1080,
    alt: 'Nærbilde av en person som smiler bredt mens de har på seg Utekos-kåpen etter isbading.',
    title: 'SherpaCore™',
    description:
      'Absorberende innside av syntetisk lammeull som starter tørke- og varmeprosessen umiddelbart.'
  }
]

export function SocialProof() {
  return (
    <article className='py-24'>
      <div className='container mx-auto px-4'>
        <div className='mx-auto max-w-3xl text-center'>
          <h2 className='text-fluid-display font-google-sans mb-4 font-bold tracking-normal'>
            Ekte kulde, ekte varme
          </h2>
        </div>

        <Carousel
          slideCount={galleryImages.length}
          ssr={CAROUSEL_SSR.responsiveThirds(
            galleryImages.length
          )}
          opts={{ loop: true, align: 'start' }}
          className='mx-auto w-full max-w-5xl'
        >
          <CarouselContent className='-ml-4'>
            {galleryImages.map((image, index) => (
              <CarouselItem
                key={index}
                className='pl-4 md:basis-1/2 lg:basis-1/3'
              >
                <div className='group p-1'>
                  <AspectRatio
                    ratio={1 / 1}
                    className='dark:bg-dark-background relative overflow-hidden rounded-lg border border-foreground/12 bg-background'
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className='transition-transform duration-500 group-hover:scale-105'
                      style={{ objectFit: 'cover' }}
                      sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                    />
                  </AspectRatio>
                  <div className='pt-4 text-left'>
                    <h4 className='font-utekos-text-medium'>
                      {image.title}
                    </h4>
                    <p className='text-sm text-overcast'>
                      {image.description}
                    </p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className='left-2 z-10 inline-flex md:-left-12.5' />
          <CarouselNext className='right-2 z-10 inline-flex md:-right-12.5' />
        </Carousel>
      </div>
    </article>
  )
}
