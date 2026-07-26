'use client'

import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { Check, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import SherpaCoreImg from '@public/1080/comfy-design-1080.png'

const features = [
  'SherpaCore™ fôr som tørker deg umiddelbart',
  'Vindtett og vannavvisende ytterstoff',
  'Store lommer med fleecefôr til kalde hender',
  'Romslig passform for enkel skifting under',
  'Toveis glidelås for maksimal fleksibilitet'
]

export function ProductSpotlight() {
  return (
    <article
      id='product-spotlight'
      className='dark:bg-dark-background overflow-hidden bg-background py-24 text-foreground'
    >
      <div className='container mx-auto px-4'>
        <div className='grid items-center gap-12 lg:grid-cols-2'>
          <AnimatedBlock className='relative mx-auto aspect-4/5 w-full max-w-md overflow-hidden rounded-2xl border border-foreground/12 shadow-2xl lg:max-w-none'>
            <Image
              src={SherpaCoreImg}
              alt='Utekos Comfyrobe detaljer'
              fill
              className='object-cover'
            />
            <div className='font-google-sans absolute top-4 right-4 rounded-full bg-mountain-view px-4 py-2 text-sm font-bold text-foreground'>
              Følgesvenn
            </div>
          </AnimatedBlock>
          <div className='space-y-8'>
            <AnimatedBlock delay='0.2s'>
              <h2 className='font-google-sans mb-4 text-4xl leading-[0.95] font-bold tracking-normal md:text-5xl'>
                Comfyrobe™
              </h2>
              <p className='leading-text-paragraph text-xl tracking-normal text-foreground'>
                Ikke bare en kåpe, men ditt viktigste
                sikkerhetsutstyr etter kuldesjokket.
              </p>
            </AnimatedBlock>

            <ul className='space-y-4'>
              {features.map((feature, i) => (
                <AnimatedBlock
                  key={i}
                  delay={`${0.3 + i * 0.1}s`}
                  className='flex items-center gap-3'
                >
                  <div className='flex size-6 shrink-0 items-center justify-center rounded-full border border-foreground/16 bg-mountain-view'>
                    <Check className='size-4 text-foreground' />
                  </div>
                  <span className='leading-text-paragraph text-lg tracking-normal'>
                    {feature}
                  </span>
                </AnimatedBlock>
              ))}
            </ul>

            <AnimatedBlock
              delay='0.8s'
              className='flex flex-col gap-4 pt-4 sm:flex-row'
            >
              <BrandBadge
                asChild
                backgroundColor='var(--primary)'
                textColor='var(--background)'
                data-track='comfyrobe-icebath-campaign-buy-now'
                className='font-google-sans min-h-14 w-full px-8 py-4 text-lg leading-[1.35] font-bold tracking-normal shadow-xl transition-transform duration-300 hover:-translate-y-0.5 hover:brightness-105 sm:w-auto'
              >
                <Link
                  href='/produkter/comfyrobe'
                  data-track='ComfyrobeIceBathingCampaignBuyNowClick'
                >
                  Kjøp nå
                  <ArrowRight className='ml-2 size-5' />
                </Link>
              </BrandBadge>
            </AnimatedBlock>
          </div>
        </div>
      </div>
    </article>
  )
}
