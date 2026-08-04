import { productImage } from '@/app/produkter/[handle]/utils/pruductImage'
import type { Image } from 'types/media'
import stapperHvit from '@/assets/images/partners/stapper-hvit.png'


export const STAPPER_PRODUCT_GALLERY_IMAGES: Image[] = [
  productImage(
    'utekos-stapper-product',
    stapperHvit,
    'Utekos Stapper kompresjonsbag.',
    1080,
    1086
  )
]
