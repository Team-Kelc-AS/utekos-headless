// Path: src/components/sections/FindInStoreSection.tsx
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import IntersportLogo from '@public/logo/Intersport_logo.svg'
import { INTERSPORT_LAKSEVAG_MAPS_URL } from '@/constants/maps'
export function FindInStoreSection() {
  return (
    <article className='bg-teal w-full border-t border-teal-50 px-4 py-16 sm:py-20'>
      <div className='container mx-auto max-w-7xl'>
        <div className='relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/50 px-8 py-12 md:px-12'>
          <div
            className='pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 opacity-15 blur-3xl'
            style={{
              background:
                'radial-gradient(circle, #022929 0%, transparent 60%)'
            }}
          />
          <div className='grid grid-cols-1 items-center gap-10 lg:grid-cols-2'>
            <div className='flex h-full items-center justify-center rounded-lg bg-white p-8 lg:p-12'>
              <Image
                src={IntersportLogo}
                alt='Intersport logo'
                width={1024}
                height={112}
                className='max-w-[250px]'
                style={{ width: '100%', height: 'auto' }}
              />
            </div>

            <div className='flex flex-col items-start text-left'>
              <div className='mb-4 flex items-center gap-3 rounded-full border border-red-500/30 bg-red-700 px-4 py-2'>
                <MapPin className='text-access/90 h-5 w-5' />
                <span className='text-acess/800 font-utekos-text-medium'>
                  Fysisk butikk i Bergen
                </span>
              </div>
              <h2 className='font-google-sans text-3xl font-bold text-balance text-white sm:text-4xl'>
                Opplev Utekos i fysisk butikk
              </h2>
              <p className='/85 mt-4 max-w-lg text-lg text-balance text-foreground/85'>
                Lyst til å kjenne på kvaliteten og finne den
                perfekte passformen? Som eneste fysiske
                forhandler i Bergen finner du et utvalg av våre
                produkter hos Intersport på Laksevåg Senter.
              </p>
              <Button
                asChild
                size='lg'
                className='group mt-6 rounded-full'
              >
                <Link
                  href={INTERSPORT_LAKSEVAG_MAPS_URL}
                  target='_blank'
                >
                  Få veibeskrivelse
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
