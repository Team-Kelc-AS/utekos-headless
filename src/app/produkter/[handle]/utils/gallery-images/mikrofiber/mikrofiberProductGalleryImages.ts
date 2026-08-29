import { productImage } from '@/app/produkter/[handle]/utils/pruductImage'
import type { Image } from 'types/media'
import mikrofiberMobile1 from '@/assets/images/mikrofiber/Mikrofiber-1000x1500-1.webp'
import mikrofiberMobile2 from '@/assets/images/mikrofiber/Mikrofiber-1000x1500-12png.jpg'
import mikrofiberMobile3 from '@/assets/images/mikrofiber/Mikrofiber-1000x1500-3.jpg'
import mikrofiberMobile4 from '@/assets/images/mikrofiber/Mikrofiber-1000x1500-4.jpg'

const MICROFIBER_MOBILE_IMAGE_WIDTH = 1000
const MICROFIBER_MOBILE_IMAGE_HEIGHT = 1500

export const MICROFIBER_MOBILE_GALLERY_IMAGES: Image[] = [
  productImage(
    'utekos-mikrofiber-mobile-1',
    mikrofiberMobile1,
    'To kvinner i Utekos Mikrofiber sitter sammen på en stein i skogen.',
    MICROFIBER_MOBILE_IMAGE_WIDTH,
    MICROFIBER_MOBILE_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-mobile-2',
    mikrofiberMobile2,
    'Fjellblå Utekos Mikrofiber i full lengde forfra.',
    MICROFIBER_MOBILE_IMAGE_WIDTH,
    MICROFIBER_MOBILE_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-mobile-3',
    mikrofiberMobile3,
    'Fjellblå Utekos Mikrofiber i full lengde bakfra.',
    MICROFIBER_MOBILE_IMAGE_WIDTH,
    MICROFIBER_MOBILE_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-mobile-4',
    mikrofiberMobile4,
    'Fjellblå Utekos Mikrofiber i parkaslengde forfra.',
    MICROFIBER_MOBILE_IMAGE_WIDTH,
    MICROFIBER_MOBILE_IMAGE_HEIGHT
  )
]

export const MICROFIBER_PRODUCT_GALLERY_IMAGES: Image[] = [
  productImage(
    'utekos-mikrofiber-kvinne-terrasseliv-product',
    'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Utekos-Mikrofiber-Full-Front-1080-1350.png',
    'Utekos Mikrofiber Fjellblå Fullfigur forfra.',
    1080,
    1350
  ),
  productImage(
    'utekos-mikrofiber-herre-terrasseliv-product',
    'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Utekos-Mikrofiber-Parkas-Fjellbla-1080-1350.png',
    'Utekos Mikrofiber Fjellblå Parkas forfra.',
    1080,
    1350
  ),
  productImage(
    'utekos-mikrofiber-kvinne-bonfire-product',
    'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Utekos-Mikrofiber-Balflammer-1080-1350.png',
    'Kvinne med Utekos Mikrofiber ved bålpanne.',
    1080,
    1350
  ),
  productImage(
    'utekos-mikrofiber-kvinne-skogholt-product',
    'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Utekos-Mikrofiber-Front-Kvinne-1600x-1600_2.png',
    'To kvinner med Utekos Mikrofiber på skogholt.',
    1080,
    1350
  ),
  productImage(
    'utekos-mikrofiber-bobil-bonfire-overlay-product',
    'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Utekos-Mikrofiber-Halv-Fjellbla-1080-1350.png',
    'Utekos Mikrofiber halvfigur Fjellblå forfra.',
    1080,
    1350
  ),
  productImage(
    'utekos-mikrofiber-kvinner-skogen-product',
    'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Utekos-Mikrofiber-Kvinner-Skogen-1080-1350_31892e97-0f6b-484a-8a64-fad1be1210fa.png',
    'Kvinner med Utekos Mikrofiber på skogen.',
    1080,
    1350
  )
]
