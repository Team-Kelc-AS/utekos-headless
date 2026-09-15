import { TECHDOWN_PRODUCT_GALLERY_IMAGES } from './techdown/productGalleryImages'
import { STAPPER_PRODUCT_GALLERY_IMAGES } from './stapper/stapperDesktopImages'
import type { Image } from 'types/media'
import { MICROFIBER_PRODUCT_GALLERY_IMAGES } from './mikrofiber/mikrofiberProductGalleryImages'
import { COMFYROBE_PRODUCT_GALLERY_IMAGES } from './comfyrobeProductGalleryImages'
import { DUN_PRODUCT_GALLERY_IMAGES } from './dun/dunProductGalleryImages'

export const PRODUCT_GALLERY_IMAGE_OVERRIDES: Partial<Record<string, Image[]>> = {
  'utekos-techdown': TECHDOWN_PRODUCT_GALLERY_IMAGES as Image[],
  'utekos-mikrofiber': MICROFIBER_PRODUCT_GALLERY_IMAGES as Image[],
  'comfyrobe': COMFYROBE_PRODUCT_GALLERY_IMAGES as Image[],
  'utekos-stapper': STAPPER_PRODUCT_GALLERY_IMAGES as Image[],
  'utekos-dun': DUN_PRODUCT_GALLERY_IMAGES as Image[]
}
