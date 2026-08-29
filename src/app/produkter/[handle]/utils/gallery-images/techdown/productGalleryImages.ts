import type { Image } from 'types/media'
import { productImage } from '@/app/produkter/[handle]/utils/pruductImage'
import techDownMobile1 from '@/assets/images/techdown/TechDown-1000x1500-1.jpg'
import techDownMobile2 from '@/assets/images/techdown/TechDown-1000x1500-2.jpg'
import techDownMobile3 from '@/assets/images/techdown/TechDown-1000x1500-3.jpg'
import techDownMobile4 from '@/assets/images/techdown/TechDown-1000x1500-4.jpg'
import techDownMobile5 from '@/assets/images/techdown/TechDown-1000x1500-5.jpg'
import techDownMobileZipper from '@/assets/images/techdown/TechDown-1000x1500-Zipper.jpg'
import techDownDesktop1 from '@/assets/images/techdown/TechDown-1800x2000.webp'
import techDownDesktop2 from '@/assets/images/techdown/TechDown2-1800x2000.webp'

const TECHDOWN_MOBILE_IMAGE_WIDTH = 1000
const TECHDOWN_MOBILE_IMAGE_HEIGHT = 1500
const TECHDOWN_DESKTOP_IMAGE_WIDTH = 1800
const TECHDOWN_DESKTOP_IMAGE_HEIGHT = 2000

export const TECHDOWN_MOBILE_GALLERY_IMAGES: Image[] = [
  productImage(
    'utekos-techdown-mobile-1',
    techDownMobile1,
    'Kvinne sitter på terrassen i Utekos TechDown med solbriller.',
    TECHDOWN_MOBILE_IMAGE_WIDTH,
    TECHDOWN_MOBILE_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-mobile-2',
    techDownMobile2,
    'Utekos TechDown i marineblå vist i trekvart profil med hette.',
    TECHDOWN_MOBILE_IMAGE_WIDTH,
    TECHDOWN_MOBILE_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-mobile-3',
    techDownMobile3,
    'Utekos TechDown sett bakfra med hette.',
    TECHDOWN_MOBILE_IMAGE_WIDTH,
    TECHDOWN_MOBILE_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-mobile-4',
    techDownMobile4,
    'Utekos TechDown i full lengde forfra med hette og glidelås.',
    TECHDOWN_MOBILE_IMAGE_WIDTH,
    TECHDOWN_MOBILE_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-mobile-5',
    techDownMobile5,
    'Utekos TechDown sett bakfra i full lengde.',
    TECHDOWN_MOBILE_IMAGE_WIDTH,
    TECHDOWN_MOBILE_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-mobile-zipper',
    techDownMobileZipper,
    'Nærbilde av YKK-glidelås og oransje draglås på Utekos TechDown.',
    TECHDOWN_MOBILE_IMAGE_WIDTH,
    TECHDOWN_MOBILE_IMAGE_HEIGHT
  )
]

export const TECHDOWN_PRODUCT_GALLERY_IMAGES: Image[] = [
  productImage(
    'utekos-techdown-desktop-1',
    techDownDesktop1,
    'Utekos TechDown i marineblå, 9:10 produktbilde.',
    TECHDOWN_DESKTOP_IMAGE_WIDTH,
    TECHDOWN_DESKTOP_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-desktop-2',
    techDownDesktop2,
    'Utekos TechDown i marineblå, andre 9:10 produktbilde.',
    TECHDOWN_DESKTOP_IMAGE_WIDTH,
    TECHDOWN_DESKTOP_IMAGE_HEIGHT
  )
]
