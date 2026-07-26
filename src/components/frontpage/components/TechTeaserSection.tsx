import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Layers,
  Shield,
  Thermometer,
  Cpu
} from 'lucide-react'
import type { Route } from 'next'
import SherpaCoraImg from '@public/1080/comfy-design-1080.png'
import TechTeaserMotion from './TechTeaserMotion'

export default function TechTeaserSection() {
  return (
    <article
      id='tech-teaser'
      className='mt-12 w-full overflow-hidden py-12 md:py-24'
    >
      <div className='container mx-auto max-w-7xl px-4'>
        <div className='relative overflow-hidden rounded-3xl border border-foreground bg-card p-8 shadow-2xl md:p-12 lg:p-20'>
          <div className='pointer-events-none absolute top-0 left-[-10%] size-150 -translate-y-1/2 rounded-full bg-mountain-view blur-[120px]' />
          <div className='pointer-events-none absolute right-0 bottom-0 size-125 translate-y-1/3 rounded-full bg-overcast blur-[100px]' />

          <div className='relative grid items-center gap-12 lg:grid-cols-2 lg:gap-20'>
            <div className='space-y-4'>
              <div className='motion-content inline-flex items-center gap-2 rounded-full border border-mountain-view/20 px-4 py-1.5 backdrop-blur-sm'>
                <div className='relative flex h-2 w-2'>
                  <span className='absolute inline-flex size-full animate-pulse rounded-full bg-mountain-view opacity-75' />
                  <span className='relative inline-flex h-2 w-2 rounded-full bg-mountain-view' />
                </div>
              </div>

              <div className='space-y-6'>
                <h2 className='motion-content font-google-sans text-4xl font-bold text-foreground sm:text-5xl md:text-6xl'>
                  Vitenskapen bak <br />
                  <span className='dark:from-dark-primary dark:to-dark-primary bg-linear-to-r from-primary via-yellow-500 to-primary bg-clip-text text-transparent'>
                    din komfort
                  </span>
                </h2>
                <p className='motion-content max-w-lg text-lg leading-relaxed text-foreground'>
                  Det handler ikke bare om varme, men om hvordan
                  varmen skapes. Fra vår hydrofobiske{' '}
                  <strong className='text-white'>
                    TechDown™
                  </strong>{' '}
                  til det robuste{' '}
                  <strong className='text-white'>
                    HydroGuard™
                  </strong>
                  -skallet.
                </p>
              </div>

              <ul className='space-y-6'>
                {[
                  {
                    icon: Thermometer,
                    title: 'Termisk effektivitet',
                    desc: 'Isolasjon som absorberer og resirkulerer kroppsvarme.',
                    color: 'text-foreground ',
                    bg: 'bg-bleached-mauve'
                  },
                  {
                    icon: Shield,
                    title: 'HydroGuard™ beskyttelse',
                    desc: 'Pustende membran med 8000mm vannsøyle.',
                    color:
                      'text-background dark:text-dark-background',
                    bg: 'bg-ancient-water'
                  },
                  {
                    icon: Layers,
                    title: '3-i-1 adaptivitet',
                    desc: 'Fra isolerende kokong til bevegelig parkas på sekunder.',
                    color: 'text-chocolate-plum',
                    bg: 'bg-overcast'
                  }
                ].map((item, idx) => (
                  <li
                    key={idx}
                    className='motion-content group flex items-start gap-4'
                  >
                    <div
                      className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-foreground ${item.bg} ${item.color} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <item.icon className='size-5' />
                    </div>
                    <div>
                      <span className='block font-utekos-text-medium text-base text-foreground transition-colors group-hover:text-ancient-water'>
                        {item.title}
                      </span>
                      <span className='group-hover:text-barely-blue block text-sm text-ancient-water transition-colors'>
                        {item.desc}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className='motion-content pt-4'>
                <Link
                  href={
                    '/handlehjelp/teknologi-materialer' as Route
                  }
                  data-track='TechTeaserSectionExploreTechClick'
                  className='group font-google-sans inline-flex h-12 items-center gap-2 rounded-full bg-white px-8 text-sm font-bold text-neutral-950 transition-all hover:scale-105 hover:bg-sky-50 active:scale-95'
                >
                  Utforsk teknologien
                  <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
                </Link>
              </div>
            </div>
            <div
              data-tech-card
              className='motion-card-visual perspective-1000 relative mx-auto w-full max-w-md lg:h-auto'
            >
              <div
                data-tilt-layer
                className='preserve-3d relative aspect-4/5 w-full'
              >
                <div className='absolute -top-4 -right-4 -z-10 size-full -translate-z-5 transform rounded-2xl border border-white/5 bg-neutral-900/50 backdrop-blur-sm' />

                <div className='relative size-full overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl'>
                  <Image
                    src={SherpaCoraImg}
                    alt='SherpaCore Technology Layer'
                    fill
                    className='object-cover opacity-80'
                    sizes='(max-width: 768px) 100vw, 33vw'
                  />
                  <div className='absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/20 to-transparent' />

                  <div
                    data-inner-parallax
                    className='motion-inner-parallax relative flex h-full flex-col justify-between p-8'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md'>
                        <Cpu className='h-3.5 w-3.5 text-havdyp' />
                        <span className='font-google-sans text-[10px] font-bold tracking-widest text-white uppercase'>
                          Core Tech
                        </span>
                      </div>
                      <Shield className='size-5 text-foreground' />
                    </div>

                    <div>
                      <div className='mb-4 space-y-1.5 opacity-60'>
                        <div className='h-1 w-12 rounded-full bg-ancient-water' />
                        <div className='bg-chocolate-plum h-1 w-8 rounded-full' />
                      </div>

                      <h3 className='font-google-sans text-3xl font-bold text-foreground'>
                        SherpaCore™
                      </h3>
                      <p className='text-sm font-medium text-ancient-water'>
                        Thermal Lining System
                      </p>
                    </div>
                  </div>
                </div>

                <div className='motion-inner-parallax dark:bg-dark-background absolute -right-6 -bottom-6 flex h-24 w-24 translate-z-10 items-center justify-center rounded-full border border-white/10 bg-background shadow-2xl'>
                  <div className='text-center'>
                    <span className='font-google-sans block text-2xl font-bold text-foreground'>
                      8K
                    </span>
                    <span className='font-google-sans text-[10px] font-bold tracking-wider text-ancient-water uppercase'>
                      Vannsøyle
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <TechTeaserMotion targetId='tech-teaser' />
        </div>
      </div>
    </article>
  )
}
