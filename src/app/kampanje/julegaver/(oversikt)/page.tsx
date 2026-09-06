// Path: src/app/kampanje/julegaver/(oversikt)/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Gift,
  Calendar,
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin
} from 'lucide-react'
import { SantaHat } from '@/components/ui/santahat'
import { connection } from 'next/server'
import { KampanjeJulegaverBreadcrumbs } from '../components/KampanjeJulegaverBreadcrumbs'
import comfyFrontUBakgrunn1080 from '@/assets/images/comfyrobe/comfy-front-u-bakgrunn-1080.png'
import dunFrontHvitBakgrunn1080 from '@/assets/images/magazine/dun-front-hvit-bakgrunn-1080.png'
import mikroFront1080 from '@/assets/images/mikrofiber/mikro-front-1080.png'
import techdown1080 from '@/assets/images/techdown/techdown-1080.png'


export const metadata: Metadata = {
  title: 'Julegavetips',
  description:
    'Finn de varmeste julegavene hos Utekos. TechDown, Comfyrobe, Dun og Mikrofiber. Utvidet bytterett og rask levering.',
  openGraph: {
    title: 'Gi bort funksjonell varme | Julegavetips fra Utekos',
    description:
      'Den perfekte gaven til livsnyteren som har alt. Sikre deg høstens store trend med utvidet bytterett frem til 15. januar.',
    url: 'https://utekos.no/kampanje/julegaver',
    siteName: 'Utekos',
    locale: 'nb_NO',
    type: 'website',
    images: [
      {
        url: 'https://utekos.no/og-utekos_brand.jpg',
        width: 1200,
        height: 630,
        alt: 'Personer som nyter utelivet med varme klær fra Utekos'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Julegavetips | Utekos',
    description:
      'Finn de varmeste julegavene hos Utekos. TechDown, Comfyrobe, Dun og Mikrofiber.',
    images: ['/og-utekos_brand.jpg']
  }
}
export default async function ChristmasCampaign() {
  await connection()

  return (
    <div className='bg-background pb-20'>
      <article className='relative overflow-hidden bg-card pt-24 pb-16 text-center text-card-foreground md:pt-32'>
        <div className='relative z-10 container mx-auto px-4'>
          <KampanjeJulegaverBreadcrumbs currentLabel='Julegaver' />
          <div className='bg-promo text-promo-foreground inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 backdrop-blur-sm'>
            <Gift className='h-4 w-4' />
            <span className='text-sm font-medium'>
              Julegaver fra Utekos®
            </span>
          </div>
          <h1 className='font-google-sans mt-8 text-4xl font-bold text-card-foreground sm:text-6xl'>
            <span className='relative inline-block'>
              Gi bort
              <SantaHat className='absolute -top-8 -left-6 h-16 w-16 -rotate-12 drop-shadow-xl md:-top-10 md:-left-8 md:h-20 md:w-20' />
            </span>
            <span className='block text-card-foreground'>
              funksjonell varme
            </span>
          </h1>
          <p className='mx-auto mt-6 max-w-2xl text-lg text-muted-foreground'>
            Den perfekte gaven til livsnyteren som har alt –
            unntatt varmen. Sikre deg høstens store trend.
          </p>
          <div className='mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row'>
            <Link
              href='#bestselgere'
              className='inline-flex h-12 items-center justify-center rounded-full bg-red-800 px-8 text-sm font-medium text-white shadow-lg shadow-red-900/20 transition-all hover:scale-105 hover:bg-red-700'
            >
              Se gavetipsene
              <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Truck className='h-4 w-4' />
              <span>Fri frakt over 999kr</span>
            </div>
          </div>
        </div>
      </article>

      <article className='border-y border-border bg-card py-8 text-card-foreground'>
        <div className='container mx-auto px-4'>
          <div className='grid gap-8 text-center sm:grid-cols-3'>
            {/* 1. Lager/Logistikk - Erstatter "Bestill innen..." */}
            <div className='flex flex-col items-center gap-3'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-background ring-1 ring-white/10'>
                <MapPin className='h-6 w-6 text-red-400' />{' '}
              </div>
              <div>
                <h3 className='font-utekos-text-medium text-foreground'>
                  Sendes samme dag
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Bestill før 17. des – vi garanterer levering
                  til jul!
                </p>
              </div>
            </div>

            {/* 2. Bytterett (Beholdes) */}
            <div className='flex flex-col items-center gap-3'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-background ring-1 ring-white/10'>
                <ShieldCheck className='h-6 w-6 text-red-400' />
              </div>
              <div>
                <h3 className='font-utekos-text-medium text-foreground'>
                  Utvidet bytterett
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Bytt gaver frem til 15. januar.
                </p>
              </div>
            </div>

            <div className='flex flex-col items-center gap-3'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-background ring-1 ring-white/10'>
                <CreditCard className='h-6 w-6 text-red-400' />
              </div>
              <div>
                <h3 className='font-utekos-text-medium text-foreground'>
                  Sikker betaling
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Betal trygt med Vipps eller Klarna.
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* --- BESTSELGERE / PRODUKTER --- */}
      <article
        id='bestselgere'
        className='container mx-auto mt-20 px-4'
      >
        <div className='mb-12 text-center'>
          <h2 className='font-google-sans text-3xl font-bold'>
            Våre mest populære gaver
          </h2>
          <p className='mt-2 text-muted-foreground'>
            Produktene som garantert blir brukt – året rundt. Nå
            med julerabatt!
          </p>
        </div>

        <div className='grid gap-8 md:grid-cols-2 lg:gap-12'>
          {/* Produkt 1: TechDown */}
          <div className='group relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition-all hover:border-commerce-primary/40'>
            <div className='font-google-sans absolute top-4 right-4 z-10 rounded-full bg-red-800 px-3 py-1 text-xs font-bold text-white shadow-lg'>
              JULERABATT
            </div>

            {/* ENDRING: Bruker 'aspect-square' som er tryggere for 1:1 enn aspect-square */}
            <div className='relative aspect-square w-full overflow-hidden bg-neutral-900'>
              <Image
                src={techdown1080}
                alt='Utekos TechDown - Vår varmeste dunponcho'
                fill
                className='object-cover transition-transform duration-700 group-hover:scale-105'
                sizes='(max-width: 768px) 100vw, 50vw'
              />
            </div>

            <div className='p-6'>
              <h3 className='font-google-sans text-2xl font-bold'>
                Utekos TechDown™
              </h3>
              <p className='mt-2 text-muted-foreground'>
                Nyhet: Vår varmeste mest allsidige modell.
                Optimalisert etter erfaringer og
                tilbakemeldinger.
              </p>
              <div className='mt-4 flex items-baseline gap-3'>
                <span className='font-google-sans text-xl font-bold text-foreground'>
                  1 990 kr
                </span>
              </div>
              <Link
                href='/produkter/utekos-techdown'
                className='mt-6 block w-full rounded-lg bg-commerce-primary py-3 text-center font-utekos-text-medium text-commerce-primary-foreground transition-colors hover:bg-commerce-primary-hover hover:text-commerce-primary-hover-foreground'
              >
                Kjøp TechDown
              </Link>
            </div>
          </div>

          <div className='group relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition-all hover:border-commerce-primary/40'>
            <div className='font-google-sans absolute top-4 right-4 z-10 rounded-full bg-blue-900 px-3 py-1 text-xs font-bold text-white shadow-lg'>
              BESTSELGER
            </div>

            <div className='relative aspect-square w-full overflow-hidden bg-neutral-900'>
              <Image
                src={dunFrontHvitBakgrunn1080}
                alt='Utekos Mikrofiber - Den originale skifteroben'
                fill
                className='object-cover transition-transform duration-700 group-hover:scale-105'
                sizes='(max-width: 768px) 100vw, 50vw'
              />
            </div>

            <div className='p-6'>
              <h3 className='font-google-sans text-2xl font-bold'>
                Utekos Mikrofiber™
              </h3>
              <p className='mt-2 text-muted-foreground'>
                Lettvekt møter varme og allsidighet. Gir deg
                følelsen av dun med ekstra fordeler.
              </p>
              <div className='mt-4 flex items-baseline gap-3'>
                <span className='font-google-sans text-xl font-bold text-foreground'>
                  1 790 kr
                </span>
              </div>
              <Link
                href='/produkter/utekos-mikrofiber'
                className='mt-6 block w-full rounded-lg bg-commerce-primary py-3 text-center font-utekos-text-medium text-commerce-primary-foreground transition-colors hover:bg-commerce-primary-hover hover:text-commerce-primary-hover-foreground'
              >
                Kjøp Mikrofiber
              </Link>
            </div>
          </div>

          <div className='group relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition-all hover:border-commerce-primary/40'>
            <div className='font-google-sans absolute top-4 right-4 z-10 rounded-full bg-orange-900 px-3 py-1 text-xs font-bold text-white shadow-lg'>
              FÅ IGJEN
            </div>

            <div className='relative aspect-square w-full overflow-hidden bg-neutral-900'>
              <Image
                src={mikroFront1080}
                alt='Utekos Dun - Premium kvalitet'
                fill
                className='object-contain p-4 transition-transform duration-700 group-hover:scale-105'
                sizes='(max-width: 768px) 100vw, 50vw'
              />
            </div>

            <div className='p-6'>
              <h3 className='font-google-sans text-2xl font-bold'>
                Utekos Dun™
              </h3>
              <p className='mt-2 text-muted-foreground'>
                Klassisk dun-kvalitet for de kaldeste dagene.
              </p>
              <div className='mt-4 flex items-baseline gap-3'>
                <span className='font-google-sans text-xl font-bold text-foreground'>
                  1 990 kr
                </span>
                <span className='text-sm text-muted-foreground line-through'>
                  3 290 kr
                </span>
              </div>
              <Link
                href='/produkter/utekos-dun'
                className='mt-6 block w-full rounded-lg bg-commerce-primary py-3 text-center font-utekos-text-medium text-commerce-primary-foreground transition-colors hover:bg-commerce-primary-hover hover:text-commerce-primary-hover-foreground'
              >
                Kjøp Dun
              </Link>
            </div>
          </div>

          <div className='group relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition-all hover:border-commerce-primary/40'>
            <div className='font-google-sans absolute top-4 right-4 z-10 rounded-full bg-neutral-800 px-3 py-1 text-xs font-bold text-white shadow-lg'>
              ALLROUNDER
            </div>

            <div className='relative aspect-square w-full overflow-hidden bg-neutral-900'>
              <Image
                src={comfyFrontUBakgrunn1080}
                alt='Utekos Comfyrobe'
                fill
                className='object-cover transition-transform duration-700 group-hover:scale-105'
                sizes='(max-width: 768px) 100vw, 50vw'
              />
            </div>

            <div className='p-6'>
              <h3 className='font-google-sans text-2xl font-bold'>
                Comfyrobe™
              </h3>
              <p className='mt-2 text-muted-foreground'>
                Den ultimate skifteroben. Vindtett, vanntett og
                foret.
              </p>
              <div className='mt-4 flex items-baseline gap-3'>
                <span className='font-google-sans text-xl font-bold text-foreground'>
                  1 290 kr
                </span>
                <span className='text-sm text-muted-foreground line-through'>
                  1 690 kr
                </span>
              </div>
              <Link
                href='/produkter/comfyrobe'
                className='mt-6 block w-full rounded-lg bg-commerce-primary py-3 text-center font-utekos-text-medium text-commerce-primary-foreground transition-colors hover:bg-commerce-primary-hover hover:text-commerce-primary-hover-foreground'
              >
                Kjøp Comfyrobe
              </Link>
            </div>
          </div>
        </div>
      </article>

      <article className='container mx-auto mt-24 mb-6 px-4'>
        <div className='mb-12 text-center'>
          <h2 className='font-google-sans text-3xl font-bold'>
            Bor du i Bergen?
          </h2>
          <Link
            href='/kampanje/julegaver/lokal-levering'
            className='mt-6 block w-full rounded-lg bg-commerce-primary py-3 text-center font-utekos-text-medium text-commerce-primary-foreground transition-colors hover:bg-commerce-primary-hover hover:text-commerce-primary-hover-foreground'
          >
            Trykk for å se eksklusivt lokal-tilbud!
          </Link>
        </div>
        <div className='grid gap-6 md:grid-cols-3'>
          <Link
            href='/produkter'
            className='group hover:bg-card-hover -hover flex flex-col items-center rounded-xl bg-card p-8 text-center text-card-foreground transition-colors'
          >
            <div className='mb-4 rounded-full bg-red-900/20 p-4 transition-transform group-hover:scale-110'>
              <Gift className='h-8 w-8 text-red-400' />
            </div>
            <h3 className='font-utekos-text-medium text-lg'>
              Hele kolleksjonen
            </h3>
            <p className='text-sm text-muted-foreground'>
              Utforsk alle våre produkter
            </p>
          </Link>

          <Link
            href='/handlehjelp/teknologi-materialer'
            className='group hover:bg-card-hover -hover flex flex-col items-center rounded-xl bg-card p-8 text-center text-card-foreground transition-colors'
          >
            <div className='mb-4 rounded-full bg-blue-900/20 p-4 transition-transform group-hover:scale-110'>
              <ShieldCheck className='h-8 w-8 text-blue-400' />
            </div>
            <h3 className='font-utekos-text-medium text-lg'>
              Lær mer
            </h3>
            <p className='text-sm text-muted-foreground'>
              Lær mer om funksjonaliteten.
            </p>
          </Link>

          <Link
            href='/handlehjelp/storrelsesguide'
            className='group hover:bg-card-hover -hover flex flex-col items-center rounded-xl bg-card p-8 text-center text-card-foreground transition-colors'
          >
            <div className='mb-4 rounded-full bg-jungle/20 p-4 transition-transform group-hover:scale-110'>
              <Calendar className='h-8 w-8 text-green-400' />
            </div>
            <h3 className='font-utekos-text-medium text-lg'>
              Usikker på størrelse?
            </h3>
            <p className='text-sm text-muted-foreground'>
              Se vår størrelsesguide og tips.
            </p>
          </Link>
        </div>
      </article>
    </div>
  )
}
