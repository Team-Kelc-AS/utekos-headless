import { productImage } from '@/app/produkter/[handle]/utils/pruductImage'
import type { Image } from 'types/media'
import mikrofiberMobile1 from '@/assets/images/mikrofiber/Mikrofiber-1000x1500-1.webp'
import mikrofiberMobile2 from '@/assets/images/mikrofiber/Mikrofiber-1000x1500-12png.jpg'
import mikrofiberMobile3 from '@/assets/images/mikrofiber/Mikrofiber-1000x1500-3.jpg'
import mikrofiberMobile4 from '@/assets/images/mikrofiber/Mikrofiber-1000x1500-4.jpg'
import mikrofiberMobileStill11 from '@/assets/images/mikrofiber/11.webp'
import mikrofiberMobileStill12 from '@/assets/images/mikrofiber/12.webp'
import mikrofiberMobileStill13 from '@/assets/images/mikrofiber/13.webp'
import mikrofiberMobileStill14 from '@/assets/images/mikrofiber/14.webp'
import mikrofiberMobileStill15 from '@/assets/images/mikrofiber/15.webp'
import mikrofiberMobileStill16 from '@/assets/images/mikrofiber/16.webp'
import mikrofiberMobileStill17 from '@/assets/images/mikrofiber/17.webp'
import mikrofiberMobileStill18 from '@/assets/images/mikrofiber/18.webp'
import mikrofiberMobileStill19 from '@/assets/images/mikrofiber/19.webp'
import mikrofiberMobileStill20 from '@/assets/images/mikrofiber/20.webp'
import mikrofiberDesktopStill1 from '@/assets/images/mikrofiber/1.webp'
import mikrofiberDesktopStill2 from '@/assets/images/mikrofiber/2.webp'
import mikrofiberDesktopStill3 from '@/assets/images/mikrofiber/3.webp'
import mikrofiberDesktopStill4 from '@/assets/images/mikrofiber/4.webp'
import mikrofiberDesktopStill5 from '@/assets/images/mikrofiber/5.webp'
import mikrofiberDesktopStill6 from '@/assets/images/mikrofiber/6.webp'
import mikrofiberDesktopStill7 from '@/assets/images/mikrofiber/7.webp'
import mikrofiberDesktopStill8 from '@/assets/images/mikrofiber/8.webp'
import mikrofiberDesktopStill9 from '@/assets/images/mikrofiber/9.webp'
import mikrofiberDesktopStill10 from '@/assets/images/mikrofiber/10.webp'

const MICROFIBER_MOBILE_IMAGE_WIDTH = 1000
const MICROFIBER_MOBILE_IMAGE_HEIGHT = 1500
const MICROFIBER_DESKTOP_STILL_NARROW_WIDTH = 1024
const MICROFIBER_DESKTOP_STILL_NARROW_HEIGHT = 1317
const MICROFIBER_DESKTOP_STILL_WIDE_WIDTH = 2048
const MICROFIBER_DESKTOP_STILL_WIDE_HEIGHT = 2633
const MICROFIBER_DESKTOP_STILL_4_WIDTH = 1048
const MICROFIBER_DESKTOP_STILL_4_HEIGHT = 1347
const MICROFIBER_MOBILE_STILL_11_WIDTH = 2800
const MICROFIBER_MOBILE_STILL_11_HEIGHT = 3600
const MICROFIBER_MOBILE_STILL_12_WIDTH = 2000
const MICROFIBER_MOBILE_STILL_12_HEIGHT = 3000
const MICROFIBER_MOBILE_STILL_14_WIDTH = 1264
const MICROFIBER_MOBILE_STILL_14_HEIGHT = 1896
const MICROFIBER_MOBILE_STILL_16_WIDTH = 800
const MICROFIBER_MOBILE_STILL_16_HEIGHT = 1200
const MICROFIBER_MOBILE_STILL_17_WIDTH = 1500
const MICROFIBER_MOBILE_STILL_17_HEIGHT = 2250

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
  ),
  productImage(
    'utekos-mikrofiber-mobile-still-11',
    mikrofiberMobileStill11,
    'Fjellblå Utekos Mikrofiber i halvfigur forfra.',
    MICROFIBER_MOBILE_STILL_11_WIDTH,
    MICROFIBER_MOBILE_STILL_11_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-mobile-still-12',
    mikrofiberMobileStill12,
    'Nærbilde av erme og mansjett på fjellblå Utekos Mikrofiber.',
    MICROFIBER_MOBILE_STILL_12_WIDTH,
    MICROFIBER_MOBILE_STILL_12_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-mobile-still-13',
    mikrofiberMobileStill13,
    'Nedre del av fjellblå Utekos Mikrofiber med strammesnor.',
    MICROFIBER_MOBILE_STILL_12_WIDTH,
    MICROFIBER_MOBILE_STILL_12_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-mobile-still-14',
    mikrofiberMobileStill14,
    'Nærbilde av glidelås og sidelomme på fjellblå Utekos Mikrofiber.',
    MICROFIBER_MOBILE_STILL_14_WIDTH,
    MICROFIBER_MOBILE_STILL_14_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-mobile-still-15',
    mikrofiberMobileStill15,
    'Nærbilde av lomme og glidelås på fjellblå Utekos Mikrofiber.',
    MICROFIBER_MOBILE_STILL_14_WIDTH,
    MICROFIBER_MOBILE_STILL_14_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-mobile-still-16',
    mikrofiberMobileStill16,
    'To kvinner i Utekos Mikrofiber sitter på en stein i skogen.',
    MICROFIBER_MOBILE_STILL_16_WIDTH,
    MICROFIBER_MOBILE_STILL_16_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-mobile-still-17',
    mikrofiberMobileStill17,
    'Fjellblå Utekos Mikrofiber i full lengde forfra.',
    MICROFIBER_MOBILE_STILL_17_WIDTH,
    MICROFIBER_MOBILE_STILL_17_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-mobile-still-18',
    mikrofiberMobileStill18,
    'Fjellblå Utekos Mikrofiber i full lengde bakfra.',
    MICROFIBER_MOBILE_STILL_17_WIDTH,
    MICROFIBER_MOBILE_STILL_17_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-mobile-still-19',
    mikrofiberMobileStill19,
    'Fjellblå Utekos Mikrofiber i full lengde forfra med hette.',
    MICROFIBER_MOBILE_STILL_17_WIDTH,
    MICROFIBER_MOBILE_STILL_17_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-mobile-still-20',
    mikrofiberMobileStill20,
    'Fjellblå Utekos Mikrofiber i parkaslengde forfra.',
    MICROFIBER_MOBILE_STILL_17_WIDTH,
    MICROFIBER_MOBILE_STILL_17_HEIGHT
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
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-1',
    mikrofiberDesktopStill1,
    'To kvinner i Utekos Mikrofiber sitter på en stein i skogen.',
    MICROFIBER_DESKTOP_STILL_NARROW_WIDTH,
    MICROFIBER_DESKTOP_STILL_NARROW_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-2',
    mikrofiberDesktopStill2,
    'Fjellblå Utekos Mikrofiber i full lengde forfra.',
    MICROFIBER_DESKTOP_STILL_WIDE_WIDTH,
    MICROFIBER_DESKTOP_STILL_WIDE_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-3',
    mikrofiberDesktopStill3,
    'Fjellblå Utekos Mikrofiber i full lengde forfra med hette.',
    MICROFIBER_DESKTOP_STILL_WIDE_WIDTH,
    MICROFIBER_DESKTOP_STILL_WIDE_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-4',
    mikrofiberDesktopStill4,
    'Fjellblå Utekos Mikrofiber i full lengde bakfra.',
    MICROFIBER_DESKTOP_STILL_4_WIDTH,
    MICROFIBER_DESKTOP_STILL_4_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-5',
    mikrofiberDesktopStill5,
    'Fjellblå Utekos Mikrofiber i parkaslengde forfra.',
    MICROFIBER_DESKTOP_STILL_WIDE_WIDTH,
    MICROFIBER_DESKTOP_STILL_WIDE_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-6',
    mikrofiberDesktopStill6,
    'Fjellblå Utekos Mikrofiber i halvfigur forfra.',
    MICROFIBER_DESKTOP_STILL_WIDE_WIDTH,
    MICROFIBER_DESKTOP_STILL_WIDE_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-7',
    mikrofiberDesktopStill7,
    'Nedre del av fjellblå Utekos Mikrofiber med strammesnor.',
    MICROFIBER_DESKTOP_STILL_WIDE_WIDTH,
    MICROFIBER_DESKTOP_STILL_WIDE_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-8',
    mikrofiberDesktopStill8,
    'Nærbilde av erme og glidelås på fjellblå Utekos Mikrofiber.',
    MICROFIBER_DESKTOP_STILL_WIDE_WIDTH,
    MICROFIBER_DESKTOP_STILL_WIDE_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-9',
    mikrofiberDesktopStill9,
    'Nærbilde av lomme og glidelås på fjellblå Utekos Mikrofiber.',
    MICROFIBER_DESKTOP_STILL_WIDE_WIDTH,
    MICROFIBER_DESKTOP_STILL_WIDE_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-10',
    mikrofiberDesktopStill10,
    'Nærbilde av glidelås og sidelomme på fjellblå Utekos Mikrofiber.',
    MICROFIBER_DESKTOP_STILL_NARROW_WIDTH,
    MICROFIBER_DESKTOP_STILL_NARROW_HEIGHT
  )
]
