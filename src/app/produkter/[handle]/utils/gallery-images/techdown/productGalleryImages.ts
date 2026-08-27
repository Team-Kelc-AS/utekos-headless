import type { Image } from 'types/media'
import { productImage } from '@/app/produkter/[handle]/utils/pruductImage'
import techDownMobileColorBg1 from '@/assets/images/techdown/ProductPage/Product-Page-Img-Color-Bg-1000x5000/Product-Page-Img-Color-Bg-1000x5000-1.webp'
import techDownMobileColorBg2 from '@/assets/images/techdown/ProductPage/Product-Page-Img-Color-Bg-1000x5000/2.webp'
import techDownMobileColorBg3 from '@/assets/images/techdown/ProductPage/Product-Page-Img-Color-Bg-1000x5000/3.webp'
import techDownMobileColorBg4 from '@/assets/images/techdown/ProductPage/Product-Page-Img-Color-Bg-1000x5000/4.webp'
import techDownMobileColorBg5 from '@/assets/images/techdown/ProductPage/Product-Page-Img-Color-Bg-1000x5000/5.webp'
import techDownMobileColorBg6 from '@/assets/images/techdown/ProductPage/Product-Page-Img-Color-Bg-1000x5000/6.webp'
import techDownMobileColorBg8 from '@/assets/images/techdown/ProductPage/Product-Page-Img-Color-Bg-1000x5000/8.webp'
import techDownDesktopStill1 from '@/assets/images/techdown/ProductPage-TechDown-1.jpg'
import techDownDesktopStill2 from '@/assets/images/techdown/ProductPage-TechDown-2.jpg'
import techDownDesktopStill3 from '@/assets/images/techdown/ProductPage-TechDown-3.jpg'
import techDownDesktopStill4 from '@/assets/images/techdown/ProductPage-TechDown-4.jpg'
import techDownDesktopStill6 from '@/assets/images/techdown/ProductPage-TechDown-6.jpg'
import techDownDesktopStill7 from '@/assets/images/techdown/ProductPage-TechDown-7png.webp'

const TECHDOWN_MOBILE_IMAGE_WIDTH = 1000
const TECHDOWN_MOBILE_IMAGE_HEIGHT = 1500

export const TECHDOWN_MOBILE_GALLERY_IMAGES: Image[] = [
  productImage(
    'utekos-techdown-mobile-color-bg-1',
    techDownMobileColorBg1,
    'Kvinne sitter i stol med Utekos TechDown og ser i kikkert.',
    TECHDOWN_MOBILE_IMAGE_WIDTH,
    TECHDOWN_MOBILE_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-mobile-color-bg-2',
    techDownMobileColorBg2,
    'Utekos TechDown i marineblå vist rett forfra med hette og fotpose i full lengde.',
    TECHDOWN_MOBILE_IMAGE_WIDTH,
    TECHDOWN_MOBILE_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-mobile-color-bg-3',
    techDownMobileColorBg3,
    'Utekos TechDown vist fra siden i full lengde.',
    TECHDOWN_MOBILE_IMAGE_WIDTH,
    TECHDOWN_MOBILE_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-mobile-color-bg-4',
    techDownMobileColorBg4,
    'Utekos TechDown sett bakfra i full lengde.',
    TECHDOWN_MOBILE_IMAGE_WIDTH,
    TECHDOWN_MOBILE_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-mobile-color-bg-5',
    techDownMobileColorBg5,
    'Kvinne slapper av i solnedgangen på terrassen ved kysten med Utekos TechDown.',
    TECHDOWN_MOBILE_IMAGE_WIDTH,
    TECHDOWN_MOBILE_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-mobile-color-bg-6',
    techDownMobileColorBg6,
    'Overdelen av Utekos TechDown sett bakfra med hette.',
    TECHDOWN_MOBILE_IMAGE_WIDTH,
    TECHDOWN_MOBILE_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-mobile-color-bg-8',
    techDownMobileColorBg8,
    'Nærbilde av brodert norsk flagg på Utekos TechDown.',
    TECHDOWN_MOBILE_IMAGE_WIDTH,
    TECHDOWN_MOBILE_IMAGE_HEIGHT
  )
]

const TECHDOWN_DESKTOP_IMAGE_WIDTH = 1440
const TECHDOWN_DESKTOP_IMAGE_HEIGHT = 1800

export const TECHDOWN_PRODUCT_GALLERY_IMAGES: Image[] = [
  productImage(
    'utekos-techdown-product-page-1',
    techDownDesktopStill1,
    'Utekos TechDown i marineblå vist rett forfra med hette og fotpose i full lengde.',
    TECHDOWN_DESKTOP_IMAGE_WIDTH,
    TECHDOWN_DESKTOP_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-product-page-2',
    techDownDesktopStill2,
    'Utekos TechDown sett bakfra i full lengde.',
    TECHDOWN_DESKTOP_IMAGE_WIDTH,
    TECHDOWN_DESKTOP_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-product-page-3',
    techDownDesktopStill3,
    'Overdelen av Utekos TechDown sett bakfra med hette i parkasmodus.',
    TECHDOWN_DESKTOP_IMAGE_WIDTH,
    TECHDOWN_DESKTOP_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-product-page-4',
    techDownDesktopStill4,
    'Utekos TechDown i marineblå vist forfra i full lengde.',
    TECHDOWN_DESKTOP_IMAGE_WIDTH,
    TECHDOWN_DESKTOP_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-product-page-6',
    techDownDesktopStill6,
    'Kvinne sitter på treterrasse med Utekos TechDown.',
    TECHDOWN_DESKTOP_IMAGE_WIDTH,
    TECHDOWN_DESKTOP_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-product-page-7',
    techDownDesktopStill7,
    'Kvinne slapper av i stol på terrassen med Utekos TechDown.',
    TECHDOWN_DESKTOP_IMAGE_WIDTH,
    TECHDOWN_DESKTOP_IMAGE_HEIGHT
  )
]
