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
import techDownSingle1 from '@/assets/images/techdown/TechDownSingle-1.webp'
import techDownSingle2 from '@/assets/images/techdown/TechDownSingle-2.webp'
import techDownSingle3 from '@/assets/images/techdown/TechDownSingle-3.webp'
import techDownSingle4 from '@/assets/images/techdown/TechDownSingle-4.webp'
import techDownSingle5 from '@/assets/images/techdown/TechDownSingle-5.webp'
import techDownSingle8 from '@/assets/images/techdown/TechDownSingle-8.webp'
import techDownGroup1 from '@/assets/images/techdown/ProduktPicTechDown-Group-1.webp'

const TECHDOWN_MOBILE_IMAGE_WIDTH = 1000
const TECHDOWN_MOBILE_IMAGE_HEIGHT = 1500
const TECHDOWN_DESKTOP_IMAGE_WIDTH = 1800
const TECHDOWN_DESKTOP_IMAGE_HEIGHT = 2000
const TECHDOWN_ADDITIONAL_DESKTOP_IMAGE_WIDTH = 1440
const TECHDOWN_ADDITIONAL_DESKTOP_IMAGE_HEIGHT = 1800

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
  ),
  productImage(
    'utekos-techdown-desktop-single-1',
    techDownSingle1,
    'Utekos TechDown i full lengde sett skrått forfra med hetten åpen.',
    TECHDOWN_ADDITIONAL_DESKTOP_IMAGE_WIDTH,
    TECHDOWN_ADDITIONAL_DESKTOP_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-desktop-single-2',
    techDownSingle2,
    'Utekos TechDown i full lengde sett bakfra med hetten oppe.',
    TECHDOWN_ADDITIONAL_DESKTOP_IMAGE_WIDTH,
    TECHDOWN_ADDITIONAL_DESKTOP_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-desktop-single-3',
    techDownSingle3,
    'Utekos TechDown i parkaslengde sett bakfra med hetten oppe.',
    TECHDOWN_ADDITIONAL_DESKTOP_IMAGE_WIDTH,
    TECHDOWN_ADDITIONAL_DESKTOP_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-desktop-single-4',
    techDownSingle4,
    'Utekos TechDown i parkaslengde sett forfra med hetten åpen.',
    TECHDOWN_ADDITIONAL_DESKTOP_IMAGE_WIDTH,
    TECHDOWN_ADDITIONAL_DESKTOP_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-desktop-single-5',
    techDownSingle5,
    'Utekos TechDown i full lengde sett forfra med hetten åpen.',
    TECHDOWN_ADDITIONAL_DESKTOP_IMAGE_WIDTH,
    TECHDOWN_ADDITIONAL_DESKTOP_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-desktop-single-8',
    techDownSingle8,
    'Person i Utekos TechDown fotograferer ved et fjellvann.',
    TECHDOWN_ADDITIONAL_DESKTOP_IMAGE_WIDTH,
    TECHDOWN_ADDITIONAL_DESKTOP_IMAGE_HEIGHT
  ),
  productImage(
    'utekos-techdown-desktop-group-1',
    techDownGroup1,
    'Tre visninger av Utekos TechDown i full lengde, forfra og bakfra.',
    TECHDOWN_ADDITIONAL_DESKTOP_IMAGE_WIDTH,
    TECHDOWN_ADDITIONAL_DESKTOP_IMAGE_HEIGHT
  )
]
