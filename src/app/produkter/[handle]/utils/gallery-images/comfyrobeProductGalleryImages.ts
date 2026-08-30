import { productImage } from '@/app/produkter/[handle]/utils/pruductImage'
import type { Image } from 'types/media'
import comfy916 from '@/assets/images/comfyrobe/comfy-916.webp'
import comfyBak916 from '@/assets/images/comfyrobe/comfy-bak-916.webp'
import comfyMann400650 from '@/assets/images/comfyrobe/comfy-mann-400-650.webp'
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

export const COMFYROBE_MOBILE_LEAD_IMAGE: Image = {
  id: 'comfyrobe-mann-mobile',
  url: comfyMann400650,
  altText: 'Mann med marineblå Comfyrobe foran en mørk trevegg.',
  width: 400,
  height: 650
}

export const COMFYROBE_MOBILE_SECOND_IMAGE: Image = {
  id: 'comfyrobe-mobile-portrait',
  url: comfy916,
  altText: 'Marineblå Comfyrobe i stående format.',
  width: 900,
  height: 1600
}

export const COMFYROBE_MOBILE_THIRD_IMAGE: Image = {
  id: 'comfyrobe-mobile-back',
  url: comfyBak916,
  altText: 'Marineblå Comfyrobe sett bakfra.',
  width: 900,
  height: 1600
}

export const COMFYROBE_PRODUCT_GALLERY_IMAGES: Image[] = [
  {
    id: 'comfyrobe-demitasse-open-front',
    url: 'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Comfyrobe-Front-1080x1350.png',
    altText: 'Comfyrobe i demitasse vist åpen forfra.',
    width: 1080,
    height: 1350
  },
  {
    id: 'comfyrobe-closed-front',
    url: 'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Comfyrobe-Front-Open-1080x1350.png',
    altText: 'Comfyrobe i demitasse vist lukket forfra.',
    width: 1080,
    height: 1350
  },
  {
    id: 'comfyrobe-back',
    url: 'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Comfyrobe-Bakside-1080x1350.png',
    altText: 'Comfyrobe i demitasse sett bakfra.',
    width: 1080,
    height: 1350
  },
  {
    id: 'comfyrobe-sherpa',
    url: 'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Comfyrobe-Sherpa-1080x1350.png',
    altText: 'Comfyrobe i demitasse med sherpa-fôr synlig.',
    width: 1080,
    height: 1350
  },
  {
    id: 'comfyrobe-sherpa-open',
    url: 'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/ComfyrobeHerre-1600x1600.webp',
    altText: 'Herre med Comfyrobe ved vannet.',
    width: 1080,
    height: 1350
  },
  {
    id: 'comfyrobe-mann-regn-brygge',
    url: 'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Comfyrobe-Kvinne-1600x1600.webp',
    altText: 'Mann med Comfyrobe på brygge i regnvær.',
    width: 1080,
    height: 1350
  },
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
  COMFYROBE_MOBILE_LEAD_IMAGE,
  COMFYROBE_MOBILE_SECOND_IMAGE,
  COMFYROBE_MOBILE_THIRD_IMAGE,
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
