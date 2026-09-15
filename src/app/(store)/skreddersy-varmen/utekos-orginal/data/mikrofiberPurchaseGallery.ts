import type { StaticImageData } from 'next/image'
import mikrofiberWoman from '@/assets/images/mikrofiber/Mikrofiber-Woman-1080x1350.webp'
import mikrofiberWoods from '@/assets/images/mikrofiber/Mikrofiber-Woods-1080x1350.webp'
import mikrofiberFull from '@/assets/images/mikrofiber/Mikrofiber-Full-1080x1350.webp'
import mikrofiberParkas from '@/assets/images/mikrofiber/Mikrofiber-Parkas-1080x1350.webp'
import mikrofiberBack from '@/assets/images/mikrofiber/Mikrofiber-Back-1080x1350.webp'
import mikrofiberUpper from '@/assets/images/mikrofiber/Mikrofiber-Upper--1080x1350.webp'

export type MikrofiberPurchaseGallerySlide = {
  id: string
  alt: string
  src: StaticImageData
}

/** All 1080×1350 (4:5) mikrofiber assets, Woman first. */
export const MIKROFIBER_PURCHASE_GALLERY: readonly MikrofiberPurchaseGallerySlide[] =
  [
    {
      id: 'woman',
      alt: 'Kvinne med Utekos Mikrofiber™ i fjellandskap',
      src: mikrofiberWoman
    },
    {
      id: 'woods',
      alt: 'Utekos Mikrofiber™ i skogen',
      src: mikrofiberWoods
    },
    {
      id: 'full',
      alt: 'Utekos Mikrofiber™ i full lengde',
      src: mikrofiberFull
    },
    {
      id: 'parkas',
      alt: 'Utekos Mikrofiber™ i parkas-modus',
      src: mikrofiberParkas
    },
    {
      id: 'back',
      alt: 'Utekos Mikrofiber™ bakfra',
      src: mikrofiberBack
    },
    {
      id: 'upper',
      alt: 'Utekos Mikrofiber™ i nærbilde av overkropp',
      src: mikrofiberUpper
    }
  ] as const
