import { productImage } from '@/app/produkter/[handle]/utils/pruductImage'
import type { Image } from 'types/media'
import comfyrobeDesktop001 from '@/assets/images/comfyrobe/Comfyrobe-001.webp'
import comfyrobeDesktop002 from '@/assets/images/comfyrobe/Comfyrobe-002.webp'
import comfyrobeDesktop0003 from '@/assets/images/comfyrobe/Comfyrobe-0003.webp'
import comfyrobeDesktop004 from '@/assets/images/comfyrobe/Comfyrobe-004.webp'
import comfyrobeSherpaColoredBg from '@/assets/images/comfyrobe/Comfyrobe-Sherpa-Colord-BG-1440x2160.webp'
import comfyrobeMobile001 from '@/assets/images/comfyrobe/Comfyrobe-Mobile-001.webp'
import comfyrobeMobile002 from '@/assets/images/comfyrobe/Comfyrobe-Mobile-002.webp'
import comfyrobeMobile003 from '@/assets/images/comfyrobe/Comfyrobe-Mobile-003.webp'
import comfyrobeMobile004 from '@/assets/images/comfyrobe/Comfyrobe-Mobile-004.webp'
import comfyrobeMobile005 from '@/assets/images/comfyrobe/Comfyrobe-Mobile-005.webp'

const COMFYROBE_DESKTOP_STILL_001_WIDTH = 1024
const COMFYROBE_DESKTOP_STILL_001_HEIGHT = 1317
const COMFYROBE_DESKTOP_STILL_WIDTH = 1400
const COMFYROBE_DESKTOP_STILL_HEIGHT = 1800
const COMFYROBE_SHERPA_STILL_WIDTH = 720
const COMFYROBE_SHERPA_STILL_HEIGHT = 1080
const COMFYROBE_MOBILE_STILL_WIDTH = 1000
const COMFYROBE_MOBILE_STILL_HEIGHT = 1500

export const COMFYROBE_PRODUCT_GALLERY_IMAGES: Image[] = [
  productImage(
    'comfyrobe-desktop-still-001',
    comfyrobeDesktop001,
    'Mann i marineblå Comfyrobe ved vannkanten.',
    COMFYROBE_DESKTOP_STILL_001_WIDTH,
    COMFYROBE_DESKTOP_STILL_001_HEIGHT
  ),
  productImage(
    'comfyrobe-desktop-still-002',
    comfyrobeDesktop002,
    'Marineblå Comfyrobe i full lengde forfra med hette.',
    COMFYROBE_DESKTOP_STILL_WIDTH,
    COMFYROBE_DESKTOP_STILL_HEIGHT
  ),
  productImage(
    'comfyrobe-desktop-still-0003',
    comfyrobeDesktop0003,
    'Marineblå Comfyrobe i full lengde forfra med synlig merkelapp.',
    COMFYROBE_DESKTOP_STILL_WIDTH,
    COMFYROBE_DESKTOP_STILL_HEIGHT
  ),
  productImage(
    'comfyrobe-desktop-still-004',
    comfyrobeDesktop004,
    'Marineblå Comfyrobe i full lengde bakfra.',
    COMFYROBE_DESKTOP_STILL_WIDTH,
    COMFYROBE_DESKTOP_STILL_HEIGHT
  ),
  productImage(
    'comfyrobe-desktop-still-sherpa',
    comfyrobeSherpaColoredBg,
    'Kremfarget sherpa-fôr mot mørk bakgrunn.',
    COMFYROBE_SHERPA_STILL_WIDTH,
    COMFYROBE_SHERPA_STILL_HEIGHT
  )
]

export const COMFYROBE_MOBILE_GALLERY_IMAGES: Image[] = [
  productImage(
    'comfyrobe-mobile-still-001',
    comfyrobeMobile001,
    'Mann i marineblå Comfyrobe ved vannkanten.',
    COMFYROBE_MOBILE_STILL_WIDTH,
    COMFYROBE_MOBILE_STILL_HEIGHT
  ),
  productImage(
    'comfyrobe-mobile-still-002',
    comfyrobeMobile002,
    'Marineblå Comfyrobe i full lengde forfra med hette.',
    COMFYROBE_MOBILE_STILL_WIDTH,
    COMFYROBE_MOBILE_STILL_HEIGHT
  ),
  productImage(
    'comfyrobe-mobile-still-003',
    comfyrobeMobile003,
    'Marineblå Comfyrobe i full lengde forfra med synlig merkelapp.',
    COMFYROBE_MOBILE_STILL_WIDTH,
    COMFYROBE_MOBILE_STILL_HEIGHT
  ),
  productImage(
    'comfyrobe-mobile-still-004',
    comfyrobeMobile004,
    'Marineblå Comfyrobe i full lengde bakfra.',
    COMFYROBE_MOBILE_STILL_WIDTH,
    COMFYROBE_MOBILE_STILL_HEIGHT
  ),
  productImage(
    'comfyrobe-mobile-still-005',
    comfyrobeMobile005,
    'Kremfarget sherpa-fôr mot mørk bakgrunn.',
    COMFYROBE_MOBILE_STILL_WIDTH,
    COMFYROBE_MOBILE_STILL_HEIGHT
  )
]
