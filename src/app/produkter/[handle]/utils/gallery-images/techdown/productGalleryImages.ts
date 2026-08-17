import type { Image } from 'types/media'
import { productImage } from '@/app/produkter/[handle]/utils/pruductImage'
import techDownMobileColorBg1 from '@/assets/images/techdown/ProductPage/Product-Page-Img-Color-Bg-1000x5000/Product-Page-Img-Color-Bg-1000x5000-1.webp'
import techDownMobileColorBg2 from '@/assets/images/techdown/ProductPage/Product-Page-Img-Color-Bg-1000x5000/2.webp'
import techDownMobileColorBg3 from '@/assets/images/techdown/ProductPage/Product-Page-Img-Color-Bg-1000x5000/3.webp'
import techDownMobileColorBg4 from '@/assets/images/techdown/ProductPage/Product-Page-Img-Color-Bg-1000x5000/4.webp'
import techDownMobileColorBg5 from '@/assets/images/techdown/ProductPage/Product-Page-Img-Color-Bg-1000x5000/5.webp'
import techDownMobileColorBg6 from '@/assets/images/techdown/ProductPage/Product-Page-Img-Color-Bg-1000x5000/6.webp'
import techDownMobileColorBg8 from '@/assets/images/techdown/ProductPage/Product-Page-Img-Color-Bg-1000x5000/8.webp'

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

export const TECHDOWN_PRODUCT_GALLERY_IMAGES: Image[] = [
  productImage(
    'utekos-techdown-kvinne-terrasseliv',
    'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/kvinne-nyter-terrasselivet-med-utekos-techdown.webp',
    'Kvinne med Utekos TechDown på terrassen.',
    1080,
    1350
  ),
  productImage(
    'utekos-techdown-kvinne-balpanne',
    'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Utekos-TechDown-Kvinne-Balpanne-1080x1350.png',
    'Kvinne med Utekos TechDown smiler lurt ved bålpannen.',
    1080,
    1350
  ),
  productImage(
    'utekos-techdown-herre-terrasseliv',
    'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Utekos-TechDown-Mann-Terrasse-1080x1350.png',
    'Mann med Utekos TechDown og solbriller slapper av på terrassen.',
    1080,
    1350
  ),
  productImage(
    'utekos-techdown-to-kvinner-terrasselivet-mobile',
    'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Utekos-TechDown-Kvinne-Kysthus-1080x1350.png',
    'Kvinne med Utekos TechDown ved kysthus.',
    1080,
    1350
  ),
  productImage(
    'utekos-techdown-bobil-bonfire-overlay-mobile',
    'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Utekos-TechDown-Kvinne-Kikker-Terrasse-1080x1350.png',
    'Kvinne med Utekos TechDown på terrasse ser på utsikt med kikkert.',
    1080,
    1350
  ),
  productImage(
    'utekos-techdown-herre-kikker',
    'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Utekos-TechDown-Herre-Kikker-1080x1350.png?v=1781242515',
    'Mann med Utekos TechDown står og bruker kikkert.',
    1080,
    1350
  )
]
